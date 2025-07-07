"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { apiService, getPhotoUrl } from "@/lib/api"
import { Grid, List, Search, Download, Eye, MapPin, Calendar, User, Camera, ExternalLink, CheckCircle, XCircle } from "lucide-react"

// Types for API data
interface Photo {
  _id: string
  property: {
    _id: string
    propertyId: string
    ward: {
      _id: string
      corporateName: string
      wardName: string
      mohallas: string[]
    }
    mohalla: string
    ownerName: string
    fatherName?: string
    address: string
    houseNo?: string
    mobileNo?: string
    propertyType?: string
    deliveryStatus: 'Pending' | 'Delivered' | 'Not Found'
  }
  staff: {
    _id?: string
    email: string
    fullName: string
    staffId?: string
    role: 'staff' | 'admin' | 'commissioner'
    isActive: boolean
  }
  deliveryDate: string
  dataSource: 'owner' | 'family' | 'tenant' | 'not_found'
  receiverName?: string
  receiverMobile?: string
  photoUrl: string
  location: {
    type: 'Point'
    coordinates: number[]
  }
  remarks?: string
  correctionStatus: 'None' | 'Pending' | 'Approved' | 'Rejected'
}

interface Filters {
  dateRange: string
  staff: string
  zone: string
  ward: string
  paidStatus: string
  search: string
}

export default function AdminPhotos() {
  const { toast } = useToast()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [filters, setFilters] = useState<Filters>({
    dateRange: "all",
    staff: "all",
    zone: "all",
    ward: "all",
    paidStatus: "all",
    search: "",
  })

  // Load data from API
  useEffect(() => {
    const loadPhotos = async () => {
      setLoading(true)
      try {
        const response = await apiService.getDeliveries()
        setPhotos(response.deliveries)
        setFilteredPhotos(response.deliveries)
        setError(false)
      } catch (err) {
        setError(true)
        toast({
          title: "Error",
          description: "Failed to load photos. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadPhotos()
  }, [toast])

  // Filter photos based on current filters
  useEffect(() => {
    const filtered = photos.filter((photo) => {
      // Add null checks for nested properties
      if (!photo.property || !photo.staff) {
        return false // Skip photos with missing data
      }
      
      const matchesStaff = filters.staff === "all" || photo.staff?.fullName === filters.staff
      const matchesZone = filters.zone === "all" || photo.property?.ward?.corporateName === filters.zone
      const matchesWard = filters.ward === "all" || photo.property?.ward?.wardName === filters.ward
      const matchesPaidStatus = filters.paidStatus === "all" || 
        (filters.paidStatus === "paid" && photo.dataSource !== 'not_found') ||
        (filters.paidStatus === "unpaid" && photo.dataSource === 'not_found')
      const matchesSearch =
        filters.search === "" ||
        (photo.property?.propertyId && photo.property.propertyId.toLowerCase().includes(filters.search.toLowerCase())) ||
        (photo.property?.ownerName && photo.property.ownerName.toLowerCase().includes(filters.search.toLowerCase()))

      let matchesDateRange = true
      if (filters.dateRange !== "all") {
        const photoDate = new Date(photo.deliveryDate)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - photoDate.getTime()) / (1000 * 60 * 60 * 24))

        switch (filters.dateRange) {
          case "today":
            matchesDateRange = daysDiff === 0
            break
          case "week":
            matchesDateRange = daysDiff <= 7
            break
          case "month":
            matchesDateRange = daysDiff <= 30
            break
        }
      }

      return matchesStaff && matchesZone && matchesWard && matchesPaidStatus && matchesSearch && matchesDateRange
    })

    setFilteredPhotos(filtered)
  }, [photos, filters])

  // Get available data for filters
  const zones = Array.from(new Set(
    photos
      .filter(p => p.property?.ward?.corporateName)
      .map(p => p.property.ward.corporateName)
  )).sort()
  
  const staff = Array.from(new Set(
    photos
      .filter(p => p.staff?.fullName)
      .map(p => p.staff.fullName)
  )).sort()

  // Get available wards for selected zone
  const availableWards = filters.zone === "all" 
    ? [] 
    : Array.from(new Set(
        photos
          .filter(p => p.property?.ward?.corporateName === filters.zone && p.property?.ward?.wardName)
          .map(p => p.property.ward.wardName)
      )).sort()

  const clearFilters = () => {
    setFilters({
      dateRange: "all",
      staff: "all",
      zone: "all",
      ward: "all",
      paidStatus: "all",
      search: "",
    })
    toast({
      title: "Filters Cleared",
      description: "All filters have been reset to default values.",
    })
  }

  const exportData = () => {
    toast({
      title: "Export Started",
      description: "Photo data is being exported to CSV...",
    })
    console.log("Exporting photo data:", filteredPhotos.length, "photos")
  }

  const openGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`
    window.open(url, "_blank")
    toast({
      title: "Opening Maps",
      description: "GPS location opened in Google Maps.",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <AuthGuard allowedRoles={["admin"]}>
        <AdminLayout>
          <div className="p-4 space-y-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </AdminLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Photo Management</h1>
              <p className="text-muted-foreground">Review and manage all delivery photos across zones</p>
            </div>
            <Button onClick={exportData} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data (.CSV)
            </Button>
          </div>

          {/* Filter Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters & Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Zone</label>
                  <Select value={filters.zone} onValueChange={(value) => setFilters(prev => ({ ...prev, zone: value, ward: "all" }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Zones</SelectItem>
                      {zones.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ward</label>
                  <Select value={filters.ward} onValueChange={(value) => setFilters(prev => ({ ...prev, ward: value }))} disabled={filters.zone === "all"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Wards</SelectItem>
                      {availableWards.map((ward) => (
                        <SelectItem key={ward} value={ward}>
                          {ward}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Staff Name</label>
                  <Select value={filters.staff} onValueChange={(value) => setFilters(prev => ({ ...prev, staff: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Staff</SelectItem>
                      {staff.map((staffName) => (
                        <SelectItem key={staffName} value={staffName}>
                          {staffName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Status</label>
                  <Select value={filters.paidStatus} onValueChange={(value) => setFilters(prev => ({ ...prev, paidStatus: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Property ID or Owner Name"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Actions</label>
                  <div className="flex gap-2">
                    <Button onClick={() => {}} size="sm" className="flex-1">
                      Apply
                    </Button>
                    <Button onClick={clearFilters} variant="outline" size="sm" className="flex-1 bg-transparent">
                      Clear
                    </Button>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Showing {filteredPhotos.length} of {photos.length} photos
              </div>
            </CardContent>
          </Card>

          {/* View Toggle */}
          <div className="flex justify-between items-center">
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as "grid" | "list")}
            >
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <Grid className="h-4 w-4 mr-2" />
                Grid View
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4 mr-2" />
                List View
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Photo Content */}
          {filteredPhotos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Photos Found</h3>
                <p className="text-muted-foreground text-center">
                  Try adjusting your filters or check another date range.
                </p>
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            /* Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredPhotos.map((photo) => (
                <Card key={photo._id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-square relative">
                    <img
                      src={getPhotoUrl(photo.photoUrl) || "/placeholder.svg"}
                      alt={`Property ${photo.property?.propertyId || 'N/A'}`}
                      className="w-full h-full object-cover"
                      onClick={() => setSelectedPhoto(photo)}
                    />
                    <Badge
                      className={`absolute top-2 right-2 ${
                        photo.dataSource === "not_found" ? "bg-red-500" : "bg-green-500"
                      } text-white`}
                    >
                      {photo.dataSource === "not_found" ? "Not Found" : "Delivered"}
                    </Badge>
                  </div>
                  <CardContent className="p-3">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{photo.property?.propertyId || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">
                        {photo.property?.ward?.corporateName || 'N/A'} → {photo.property?.ward?.wardName || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">{photo.staff?.fullName || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(photo.deliveryDate)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* List View */
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property ID</TableHead>
                        <TableHead>Owner Name</TableHead>
                        <TableHead>Zone → Ward</TableHead>
                        <TableHead>Staff Name</TableHead>
                        <TableHead>Submitted At</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPhotos.map((photo) => (
                        <TableRow key={photo._id} className="hover:bg-accent">
                          <TableCell className="font-medium">{photo.property?.propertyId || 'N/A'}</TableCell>
                          <TableCell>{photo.property?.ownerName || 'N/A'}</TableCell>
                          <TableCell>
                            {photo.property?.ward?.corporateName || 'N/A'} → {photo.property?.ward?.wardName || 'N/A'}
                          </TableCell>
                          <TableCell>{photo.staff?.fullName || 'N/A'}</TableCell>
                          <TableCell>{formatDate(photo.deliveryDate)}</TableCell>
                          <TableCell>
                            <Badge
                              className={`${photo.dataSource === "not_found" ? "bg-red-500" : "bg-green-500"} text-white`}
                            >
                              {photo.dataSource === "not_found" ? "Not Found" : "Delivered"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => setSelectedPhoto(photo)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photo Preview Modal */}
          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              {selectedPhoto && (
                <>
                  <DialogHeader>
                    <DialogTitle>Photo Details</DialogTitle>
                    <DialogDescription>
                      Submitted by {selectedPhoto.staff?.fullName || 'N/A'} on {formatDate(selectedPhoto.deliveryDate)}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image */}
                    <div className="space-y-4">
                      <img
                        src={getPhotoUrl(selectedPhoto.photoUrl) || "/placeholder.svg"}
                        alt={`Property ${selectedPhoto.property?.propertyId || 'N/A'}`}
                        className="w-full rounded-lg border"
                      />
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Property ID</label>
                          <p className="font-medium">{selectedPhoto.property?.propertyId || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Owner Name</label>
                          <p className="font-medium">{selectedPhoto.property?.ownerName || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Zone</label>
                          <p className="font-medium">{selectedPhoto.property?.ward?.corporateName || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Ward</label>
                          <p className="font-medium">{selectedPhoto.property?.ward?.wardName || 'N/A'}</p>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Staff Member</label>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <p className="font-medium">{selectedPhoto.staff?.fullName || 'N/A'}</p>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Submission Time</label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <p className="font-medium">{formatDate(selectedPhoto.deliveryDate)}</p>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div className="flex items-center gap-2">
                          {selectedPhoto.dataSource === "not_found" ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          <Badge
                            className={`${
                              selectedPhoto.dataSource === "not_found" ? "bg-red-500" : "bg-green-500"
                            } text-white`}
                          >
                            {selectedPhoto.dataSource === "not_found" ? "Not Found" : "Delivered"}
                          </Badge>
                        </div>
                      </div>

                      {selectedPhoto.receiverName && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Receiver Name</label>
                          <p className="font-medium">{selectedPhoto.receiverName}</p>
                        </div>
                      )}

                      {selectedPhoto.receiverMobile && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Receiver Mobile</label>
                          <p className="font-medium">{selectedPhoto.receiverMobile}</p>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">GPS Coordinates</label>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <p className="font-medium">
                            {selectedPhoto.location.coordinates[1].toFixed(6)}, {selectedPhoto.location.coordinates[0].toFixed(6)}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              openGoogleMaps(selectedPhoto.location.coordinates[1], selectedPhoto.location.coordinates[0])
                            }
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Maps
                          </Button>
                        </div>
                      </div>

                      {selectedPhoto.remarks && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Remarks</label>
                          <p className="font-medium">{selectedPhoto.remarks}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
