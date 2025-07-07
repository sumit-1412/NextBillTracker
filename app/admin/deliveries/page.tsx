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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Grid, List, Search, Download, Eye, MapPin, Calendar, User, Camera, ExternalLink, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiService, getPhotoUrl } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

// Types for API data
interface Delivery {
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

export default function AdminDeliveries() {
  const { toast } = useToast()
  const [viewType, setViewType] = useState<"grid" | "list">("grid")
  const [dateRange, setDateRange] = useState("all")
  const [selectedZone, setSelectedZone] = useState("all")
  const [selectedWard, setSelectedWard] = useState("all")
  const [selectedStaff, setSelectedStaff] = useState("all")
  const [dataSource, setDataSource] = useState("all")
  const [correctionStatus, setCorrectionStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)

  // Load data from API
  useEffect(() => {
    const loadDeliveries = async () => {
      try {
        setLoading(true)
        const response = await apiService.getDeliveries()
        console.log('Raw deliveries response:', response)
        console.log('Deliveries array:', response.deliveries)
        
        // Log the structure of the first delivery to understand the data format
        if (response.deliveries.length > 0) {
          console.log('First delivery structure:', response.deliveries[0])
          console.log('First delivery property:', response.deliveries[0].property)
        }
        
        setDeliveries(response.deliveries)
        setFilteredDeliveries(response.deliveries)
      } catch (error) {
        console.error('Error loading deliveries:', error)
        toast({
          title: "Error",
          description: "Failed to load deliveries. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadDeliveries()
  }, [toast])

  // Filter deliveries based on current filters
  useEffect(() => {
    console.log('Filtering deliveries. Total:', deliveries.length)
    const filtered = deliveries.filter((delivery) => {
      // More flexible null checks - allow deliveries with incomplete data
      if (!delivery.property) {
        console.log('Skipping delivery due to missing property:', delivery._id)
        return false
      }
      
      // Check if we have basic property data
      const hasBasicPropertyData = delivery.property.propertyId || delivery.property.ownerName
      if (!hasBasicPropertyData) {
        console.log('Skipping delivery due to missing basic property data:', delivery._id)
        return false
      }
      
      // Use optional chaining for nested properties with fallback values
      const zoneName = delivery.property.ward?.corporateName || 'Unknown Zone'
      const wardName = delivery.property.ward?.wardName || 'Unknown Ward'
      const staffName = delivery.staff?.fullName || 'Unknown Staff'
      
      const matchesZone = selectedZone === "all" || zoneName === selectedZone
      const matchesWard = selectedWard === "all" || wardName === selectedWard
      const matchesStaff = selectedStaff === "all" || staffName === selectedStaff
      const matchesDataSource = dataSource === "all" || delivery.dataSource === dataSource
      const matchesCorrectionStatus = correctionStatus === "all" || delivery.correctionStatus === correctionStatus
      const matchesSearch =
        searchQuery === "" ||
        (delivery.property.propertyId && delivery.property.propertyId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (delivery.property.ownerName && delivery.property.ownerName.toLowerCase().includes(searchQuery.toLowerCase()))

      let matchesDateRange = true
      if (dateRange !== "all") {
        const deliveryDate = new Date(delivery.deliveryDate)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24))

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

      return matchesZone && matchesWard && matchesStaff && matchesDataSource && matchesCorrectionStatus && matchesSearch && matchesDateRange
    })

    console.log('Filtered deliveries:', filtered.length)
    setFilteredDeliveries(filtered)
    setCurrentPage(1)
  }, [deliveries, selectedZone, selectedWard, selectedStaff, dataSource, correctionStatus, searchQuery, dateRange])

  // Get available data for filters - more flexible
  const zones = Array.from(new Set(
    deliveries
      .filter(d => d.property && d.property.ward?.corporateName)
      .map(d => d.property.ward?.corporateName || 'Unknown Zone')
  )).sort()
  
  const staff = Array.from(new Set(
    deliveries
      .filter(d => d.staff && d.staff.fullName)
      .map(d => d.staff.fullName)
  )).sort()

  // Get available wards for selected zone - more flexible
  const availableWards = selectedZone === "all" 
    ? [] 
    : Array.from(new Set(
        deliveries
          .filter(d => d.property && d.property.ward && 
            (d.property.ward.corporateName === selectedZone || selectedZone === 'Unknown Zone'))
          .map(d => d.property.ward?.wardName || 'Unknown Ward')
      )).sort()

  // Paginate filtered deliveries
  const paginatedDeliveries = filteredDeliveries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const totalPages = Math.ceil(filteredDeliveries.length / pageSize)

  const clearFilters = () => {
    setDateRange("all")
    setSelectedZone("all")
    setSelectedWard("all")
    setSelectedStaff("all")
    setDataSource("all")
    setCorrectionStatus("all")
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
      description: `Found ${filteredDeliveries.length} deliveries matching your criteria.`,
    })
  }

  const exportData = () => {
    toast({
      title: "Export Started",
      description: "Delivery data is being exported to CSV...",
    })
    console.log("Exporting delivery data:", filteredDeliveries.length, "deliveries")
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

  // Manual refresh function
  const handleRefresh = async () => {
    try {
      setLoading(true)
      const response = await apiService.getDeliveries()
      setDeliveries(response.deliveries)
      setFilteredDeliveries(response.deliveries)
      toast({
        title: "Data Refreshed",
        description: "Delivery data has been updated successfully.",
      })
    } catch (error) {
      console.error('Error refreshing deliveries:', error)
      toast({
        title: "Refresh Error",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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
              <h1 className="text-3xl font-bold text-foreground">Delivery Management</h1>
              <p className="text-muted-foreground">Monitor and manage all delivery operations across zones</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportData} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data (.CSV)
              </Button>
            </div>
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
                      {staff.map((staffName) => (
                        <SelectItem key={staffName} value={staffName}>
                          {staffName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Source</label>
                  <Select value={dataSource} onValueChange={setDataSource}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="tenant">Tenant</SelectItem>
                      <SelectItem value="not_found">Not Found</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Correction Status</label>
                  <Select value={correctionStatus} onValueChange={setCorrectionStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="None">No Corrections</SelectItem>
                      <SelectItem value="Pending">Pending Review</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
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
                Showing {filteredDeliveries.length} of {deliveries.length} deliveries
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

          {/* Delivery Content */}
          {filteredDeliveries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Deliveries Found</h3>
                <p className="text-muted-foreground text-center">
                  Try adjusting your filters or check another date range.
                </p>
              </CardContent>
            </Card>
          ) : viewType === "grid" ? (
            /* Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {paginatedDeliveries.map((delivery) => (
                <Card key={delivery._id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-square relative">
                    <img
                      src={getPhotoUrl(delivery.photoUrl)}
                      alt={`Property ${delivery.property.propertyId}`}
                      className="w-full h-full object-cover"
                      onClick={() => setSelectedDelivery(delivery)}
                    />
                    <Badge
                      className={`absolute top-2 right-2 ${
                        delivery.dataSource === "not_found" ? "bg-red-500" : "bg-green-500"
                      } text-white`}
                    >
                      {delivery.dataSource === "not_found" ? "Not Found" : "Delivered"}
                    </Badge>
                  </div>
                  <CardContent className="p-3">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{delivery.property?.propertyId || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">
                        {delivery.property?.ward?.corporateName || 'N/A'} → {delivery.property?.ward?.wardName || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">{delivery.staff?.fullName || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(delivery.deliveryDate)}</p>
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
                        <TableHead>Delivered At</TableHead>
                        <TableHead>Data Source</TableHead>
                        <TableHead>Correction Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedDeliveries.map((delivery) => (
                        <TableRow key={delivery._id} className="hover:bg-accent">
                          <TableCell className="font-medium">{delivery.property?.propertyId || 'N/A'}</TableCell>
                          <TableCell>{delivery.property?.ownerName || 'N/A'}</TableCell>
                          <TableCell>
                            {delivery.property?.ward?.corporateName || 'N/A'} → {delivery.property?.ward?.wardName || 'N/A'}
                          </TableCell>
                          <TableCell>{delivery.staff?.fullName || 'N/A'}</TableCell>
                          <TableCell>{formatDate(delivery.deliveryDate)}</TableCell>
                          <TableCell>
                            <Badge
                              className={`${delivery.dataSource === "not_found" ? "bg-red-500" : "bg-green-500"} text-white`}
                            >
                              {delivery.dataSource === "not_found" ? "Not Found" : "Delivered"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                delivery.correctionStatus === "Approved" ? "default" :
                                delivery.correctionStatus === "Rejected" ? "destructive" :
                                delivery.correctionStatus === "Pending" ? "secondary" : "outline"
                              }
                            >
                              {delivery.correctionStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => setSelectedDelivery(delivery)}>
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

          {/* Delivery Preview Modal */}
          <Dialog open={!!selectedDelivery} onOpenChange={() => setSelectedDelivery(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              {selectedDelivery && (
                <>
                  <DialogHeader>
                    <DialogTitle>Delivery Details</DialogTitle>
                    <DialogDescription>
                      Submitted by {selectedDelivery.staff?.fullName || 'N/A'} on {formatDate(selectedDelivery.deliveryDate)}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image */}
                    <div className="space-y-4">
                      <img
                        src={getPhotoUrl(selectedDelivery.photoUrl)}
                        alt={`Property ${selectedDelivery.property?.propertyId || 'N/A'}`}
                        className="w-full rounded-lg border"
                      />
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Property ID</label>
                          <p className="font-medium">{selectedDelivery.property?.propertyId || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Owner Name</label>
                          <p className="font-medium">{selectedDelivery.property?.ownerName || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Zone</label>
                          <p className="font-medium">{selectedDelivery.property?.ward?.corporateName || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Ward</label>
                          <p className="font-medium">{selectedDelivery.property?.ward?.wardName || 'N/A'}</p>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Staff Member</label>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <p className="font-medium">{selectedDelivery.staff?.fullName || 'N/A'}</p>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Delivery Time</label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <p className="font-medium">{formatDate(selectedDelivery.deliveryDate)}</p>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Data Source</label>
                        <div className="flex items-center gap-2">
                          {selectedDelivery.dataSource === "not_found" ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          <Badge
                            className={`${
                              selectedDelivery.dataSource === "not_found" ? "bg-red-500" : "bg-green-500"
                            } text-white`}
                          >
                            {selectedDelivery.dataSource === "not_found" ? "Not Found" : "Delivered"}
                          </Badge>
                        </div>
                      </div>

                      {selectedDelivery.receiverName && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Receiver Name</label>
                          <p className="font-medium">{selectedDelivery.receiverName}</p>
                        </div>
                      )}

                      {selectedDelivery.receiverMobile && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Receiver Mobile</label>
                          <p className="font-medium">{selectedDelivery.receiverMobile}</p>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Correction Status</label>
                        <Badge
                          variant={
                            selectedDelivery.correctionStatus === "Approved" ? "default" :
                            selectedDelivery.correctionStatus === "Rejected" ? "destructive" :
                            selectedDelivery.correctionStatus === "Pending" ? "secondary" : "outline"
                          }
                        >
                          {selectedDelivery.correctionStatus}
                        </Badge>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">GPS Coordinates</label>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <p className="font-medium">
                            {selectedDelivery.location.coordinates[1].toFixed(6)}, {selectedDelivery.location.coordinates[0].toFixed(6)}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              openGoogleMaps(selectedDelivery.location.coordinates[1], selectedDelivery.location.coordinates[0])
                            }
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Maps
                          </Button>
                        </div>
                      </div>

                      {selectedDelivery.remarks && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Remarks</label>
                          <p className="font-medium">{selectedDelivery.remarks}</p>
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
