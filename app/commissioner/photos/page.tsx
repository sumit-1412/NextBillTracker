"use client"

import { useState, useMemo, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import CommissionerLayout from "@/components/commissioner-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Grid, List, Search, Download, Eye, MapPin, Calendar, User, Camera, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiService, getPhotoUrl } from "@/lib/api"

// Types for API data
interface Photo {
  id: number
  propertyId: string
  ownerName: string
  zone: string
  ward: string
  staffName: string
  photoUrl: string
  deliveryDate: string
  paid: boolean
  dataSource: 'owner' | 'family' | 'tenant' | 'not_found'
  gpsCoordinates: {
    lat: number
    lng: number
  }
  submissionId: string
}

export default function CommissionerPhotos() {
  const { toast } = useToast() as { toast: any }
  const [viewType, setViewType] = useState<"grid" | "list">("grid")
  const [dateRange, setDateRange] = useState("all")
  const [selectedZone, setSelectedZone] = useState("all")
  const [selectedWard, setSelectedWard] = useState("all")
  const [selectedStaff, setSelectedStaff] = useState("all")
  const [dataSource, setDataSource] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)

  // Load data from API
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        setLoading(true)
        const response = await apiService.getDeliveries()
        
        // Transform deliveries to photo format
        const photos = response.deliveries.map((delivery: any, index: number) => ({
          id: index + 1,
          propertyId: delivery.property?.propertyId || 'N/A',
          ownerName: delivery.property?.ownerName || 'N/A',
          zone: delivery.property?.ward?.corporateName || 'N/A',
          ward: delivery.property?.ward?.wardName || 'N/A',
          staffName: delivery.staff?.fullName || 'N/A',
          photoUrl: getPhotoUrl(delivery.photoUrl),
          deliveryDate: delivery.deliveryDate,
          paid: delivery.dataSource !== 'not_found',
          dataSource: delivery.dataSource,
          gpsCoordinates: {
            lat: delivery.location.coordinates[1],
            lng: delivery.location.coordinates[0]
          },
          submissionId: delivery._id
        }))

        setPhotos(photos)
      } catch (error) {
        console.error('Error loading photos:', error)
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
  const filteredPhotos = useMemo(() => {
    return photos.filter((photo: Photo) => {
      const matchesZone = selectedZone === "all" || photo.zone === selectedZone
      const matchesWard = selectedWard === "all" || photo.ward === selectedWard
      const matchesStaff = selectedStaff === "all" || photo.staffName === selectedStaff
      const matchesPaidStatus = dataSource === "all" || (dataSource === "paid" ? photo.paid : !photo.paid)
      const matchesSearch =
        searchQuery === "" ||
        photo.propertyId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        photo.ownerName.toLowerCase().includes(searchQuery.toLowerCase())

      let matchesDateRange = true
      if (dateRange !== "all") {
        const photoDate = new Date(photo.deliveryDate)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - photoDate.getTime()) / (1000 * 60 * 60 * 24))

        switch (dateRange) {
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

      return matchesZone && matchesWard && matchesStaff && matchesPaidStatus && matchesSearch && matchesDateRange
    })
  }, [photos, selectedZone, selectedWard, selectedStaff, dataSource, searchQuery, dateRange])

  // Get available data for filters
  const zones = Array.from(new Set(photos.map((photo: Photo) => photo.zone))).sort()
  const staff = Array.from(new Set(photos.map((photo: Photo) => photo.staffName))).sort()

  // Get available wards for selected zone
  const availableWards = selectedZone === "all" 
    ? [] 
    : Array.from(
        new Set(photos.filter((photo: Photo) => photo.zone === selectedZone).map((photo: Photo) => photo.ward))
      ).sort()

  // Paginate filtered photos
  const paginatedPhotos = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredPhotos.slice(startIndex, startIndex + pageSize)
  }, [filteredPhotos, currentPage, pageSize])

  const totalPages = Math.ceil(filteredPhotos.length / pageSize)

  const clearFilters = () => {
    setDateRange("all")
    setSelectedZone("all")
    setSelectedWard("all")
    setSelectedStaff("all")
    setDataSource("all")
    setSearchQuery("")
    setCurrentPage(1)
    toast({
      title: "Filters Cleared",
      description: "All filters have been reset to default values.",
    })
  }

  const applyFilters = () => {
    setCurrentPage(1)
    toast({
      title: "Filters Applied",
      description: `Found ${filteredPhotos.length} photos matching your criteria.`,
    })
    console.log("Filters applied:", {
      dateRange,
      selectedZone,
      selectedWard,
      selectedStaff,
      dataSource,
      searchQuery,
    })
  }

  const exportData = () => {
    toast({
      title: "Export Started",
      description: "Photo metadata is being exported to CSV...",
    })
    console.log("Exporting photo metadata:", filteredPhotos.length, "photos")
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

  return (
    <AuthGuard allowedRoles={["commissioner"]}>
      <CommissionerLayout>
        <div className="p-4 space-y-6 bg-background">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Photo Gallery</h1>
              <p className="text-muted-foreground">Review and audit delivery photos submitted by field staff</p>
            </div>
            <Button onClick={exportData} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Metadata (.CSV)
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
                  <Select value={dateRange} onValueChange={setDateRange}>
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
                  <Select value={selectedZone} onValueChange={setSelectedZone}>
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
                  <Select value={selectedWard} onValueChange={setSelectedWard} disabled={selectedZone === "all"}>
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
                  <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Staff</SelectItem>
                      {staff.map((staffName: string) => (
                        <SelectItem key={staffName} value={staffName}>
                          {staffName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Paid Status</label>
                  <Select value={dataSource} onValueChange={setDataSource}>
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
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Actions</label>
                  <div className="flex gap-2">
                    <Button onClick={applyFilters} size="sm" className="flex-1">
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
              value={viewType}
              onValueChange={(value) => value && setViewType(value as "grid" | "list")}
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

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Page size:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number.parseInt(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Photo Content */}
          {loading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center">Loading photos...</p>
              </CardContent>
            </Card>
          ) : filteredPhotos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Photos Found</h3>
                <p className="text-muted-foreground text-center">
                  Try adjusting your filters or check another date range.
                </p>
              </CardContent>
            </Card>
          ) : viewType === "grid" ? (
            /* Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {paginatedPhotos.map((photo: Photo) => (
                <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-square relative">
                    <img
                      src={getPhotoUrl(photo.photoUrl) || "/placeholder.svg"}
                      alt={`Property ${photo.propertyId}`}
                      className="w-full h-full object-cover rounded-lg"
                      onClick={() => setSelectedPhoto(photo)}
                    />
                    <Badge
                      className={`absolute top-2 right-2 ${
                        photo.paid ? "bg-green-500" : "bg-red-500"
                      } text-white`}
                    >
                      {photo.paid ? "Paid" : "Unpaid"}
                    </Badge>
                  </div>
                  <CardContent className="p-3">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{photo.propertyId}</p>
                      <p className="text-xs text-muted-foreground">
                        {photo.zone} → {photo.ward}
                      </p>
                      <p className="text-xs text-muted-foreground">{photo.staffName}</p>
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
                        <TableHead>Paid Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPhotos.map((photo: Photo) => (
                        <TableRow key={photo.id} className="hover:bg-accent">
                          <TableCell className="font-medium">{photo.propertyId}</TableCell>
                          <TableCell>{photo.ownerName}</TableCell>
                          <TableCell>
                            {photo.zone} → {photo.ward}
                          </TableCell>
                          <TableCell>{photo.staffName}</TableCell>
                          <TableCell>{formatDate(photo.deliveryDate)}</TableCell>
                          <TableCell>
                            <Badge
                              className={`${photo.paid ? "bg-green-500" : "bg-red-500"} text-white`}
                            >
                              {photo.paid ? "Paid" : "Unpaid"}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  {totalPages > 5 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {/* Photo Preview Modal */}
          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              {selectedPhoto && (
                <>
                  <DialogHeader>
                    <DialogTitle>Property Photo Details</DialogTitle>
                    <DialogDescription>
                      Submitted by {selectedPhoto.staffName} on {formatDate(selectedPhoto.deliveryDate)}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image */}
                    <div className="space-y-4">
                      <img
                        src={getPhotoUrl(selectedPhoto.photoUrl) || "/placeholder.svg"}
                        alt={`Property ${selectedPhoto.propertyId}`}
                        className="w-full rounded-lg border"
                      />
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Property ID</label>
                          <p className="font-medium">{selectedPhoto.propertyId}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Owner Name</label>
                          <p className="font-medium">{selectedPhoto.ownerName}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Zone</label>
                          <p className="font-medium">{selectedPhoto.zone}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Ward</label>
                          <p className="font-medium">{selectedPhoto.ward}</p>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Staff Member</label>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <p className="font-medium">{selectedPhoto.staffName}</p>
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
                        <label className="text-sm font-medium text-muted-foreground">Payment Status</label>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`${
                              selectedPhoto.paid ? "bg-green-500" : "bg-red-500"
                            } text-white`}
                          >
                            {selectedPhoto.paid ? "Paid" : "Unpaid"}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">GPS Coordinates</label>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <p className="font-medium">
                            {selectedPhoto.gpsCoordinates.lat.toFixed(6)}, {selectedPhoto.gpsCoordinates.lng.toFixed(6)}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              openGoogleMaps(selectedPhoto.gpsCoordinates.lat, selectedPhoto.gpsCoordinates.lng)
                            }
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Maps
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Submission ID</label>
                        <p className="font-mono text-sm">{selectedPhoto.submissionId}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CommissionerLayout>
    </AuthGuard>
  )
}
