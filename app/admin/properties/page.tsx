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
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import {
  Download,
  Search,
  AlertTriangle,
  Eye,
  Settings2,
  ChevronLeft,
  ChevronRight,
  Save,
  RotateCcw,
} from "lucide-react"

// Updated interface to match API structure
interface Property {
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

export default function AdminProperties() {
  const { toast } = useToast()
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Filter states
  const [filters, setFilters] = useState({
    propertyId: "",
    ownerName: "",
    corporateName: "",
    ward: "",
    mohalla: "",
    propertyType: "",
    deliveryStatus: "all",
    undeliveredOnly: false,
  })

  // Column visibility
  const [columnVisibility, setColumnVisibility] = useState({
    corporateInfo: true,
    propertyDetails: true,
    contactInfo: true,
    deliveryInfo: true,
  })

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Edit form state
  const [editForm, setEditForm] = useState<Property | null>(null)

  // Load data from API
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true)
        const response = await apiService.getProperties()
        setProperties(response.properties)
        setFilteredProperties(response.properties)
      } catch (error) {
        console.error('Error loading properties:', error)
        toast({
          title: "Error",
          description: "Failed to load properties. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadProperties()
  }, [toast])

  // Filter logic
  useEffect(() => {
    const filtered = properties.filter((property) => {
      const matchesPropertyId =
        !filters.propertyId || property.propertyId.toLowerCase().includes(filters.propertyId.toLowerCase())

      const matchesOwnerName =
        !filters.ownerName || property.ownerName.toLowerCase().includes(filters.ownerName.toLowerCase())

      const matchesCorporateName =
        !filters.corporateName || property.ward.corporateName.toLowerCase().includes(filters.corporateName.toLowerCase())

      const matchesWard = !filters.ward || property.ward.wardName === filters.ward
      const matchesMohalla = !filters.mohalla || property.mohalla === filters.mohalla
      const matchesPropertyType = !filters.propertyType || property.propertyType === filters.propertyType

      const matchesDeliveryStatus =
        filters.deliveryStatus === "all" ||
        property.deliveryStatus === filters.deliveryStatus

      const matchesUndelivered = !filters.undeliveredOnly || property.deliveryStatus === 'Pending'

      return (
        matchesPropertyId &&
        matchesOwnerName &&
        matchesCorporateName &&
        matchesWard &&
        matchesMohalla &&
        matchesPropertyType &&
        matchesDeliveryStatus &&
        matchesUndelivered
      )
    })

    setFilteredProperties(filtered)
    setCurrentPage(1)
  }, [properties, filters])

  // Get available corporate names
  const corporateNames = Array.from(new Set(properties.map(p => p.ward.corporateName))).sort()

  // Get available wards for selected corporate name
  const getAvailableWards = () => {
    if (!filters.corporateName) return []
    return Array.from(
      new Set(
        properties
          .filter(p => p.ward.corporateName === filters.corporateName)
          .map(p => p.ward.wardName)
      )
    ).sort()
  }

  // Get available mohallas for selected ward
  const getAvailableMohallas = () => {
    if (!filters.ward) return []
    return Array.from(
      new Set(
        properties
          .filter(p => p.ward.wardName === filters.ward)
          .map(p => p.mohalla)
      )
    ).sort()
  }

  // Handle filter changes
  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }

      // Reset dependent filters when parent changes
      if (key === "corporateName") {
        newFilters.ward = ""
        newFilters.mohalla = ""
      }
      if (key === "ward") {
        newFilters.mohalla = ""
      }

      return newFilters
    })
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      propertyId: "",
      ownerName: "",
      corporateName: "",
      ward: "",
      mohalla: "",
      propertyType: "",
      deliveryStatus: "all",
      undeliveredOnly: false,
    })
    setCurrentPage(1)
    toast({
      title: "Filters Reset",
      description: "All filters have been cleared successfully.",
    })
  }

  // Export to CSV
  const exportToCSV = () => {
    const csvData = filteredProperties.map((property) => ({
      "Property ID": property.propertyId,
      "Corporate Name": property.ward.corporateName,
      "Ward": property.ward.wardName,
      "Mohalla": property.mohalla,
      "Owner Name": property.ownerName,
      "Father Name": property.fatherName || "",
      "House No": property.houseNo || "",
      "Address": property.address,
      "Mobile No": property.mobileNo || "",
      "Property Type": property.propertyType || "",
      "Delivery Status": property.deliveryStatus,
    }))

    // Mock CSV export
    console.log("Exporting CSV:", csvData)
    toast({
      title: "Export Started",
      description: `Exporting ${filteredProperties.length} properties to CSV...`,
    })

    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: "Properties data has been exported successfully.",
      })
    }, 2000)
  }

  // Handle row click
  const handleRowClick = (property: Property) => {
    setSelectedProperty(property)
    setEditForm({ ...property })
    setDrawerOpen(true)
  }

  // Handle save property
  const handleSaveProperty = () => {
    if (!editForm) return

    setProperties((prev) => prev.map((p) => (p._id === editForm._id ? editForm : p)))

    toast({
      title: "Property Updated",
      description: `Property ${editForm.propertyId} has been updated successfully.`,
    })

    setDrawerOpen(false)
    setSelectedProperty(null)
    setEditForm(null)
  }

  // Pagination
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProperties = filteredProperties.slice(startIndex, startIndex + itemsPerPage)

  // Truncate text
  const truncateText = (text: string, maxLength = 30) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  if (loading) {
    return (
      <AuthGuard allowedRoles={["admin"]}>
        <AdminLayout>
          <div className="p-4 space-y-4">
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
        <TooltipProvider>
          <div className="p-4 space-y-4">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Properties Master</h1>
                <p className="text-muted-foreground">
                  Manage and view all property records ({filteredProperties.length} of {properties.length} properties)
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={exportToCSV} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="propertyId">Property ID</Label>
                    <Input
                      id="propertyId"
                      placeholder="Search by Property ID"
                      value={filters.propertyId}
                      onChange={(e) => handleFilterChange("propertyId", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Owner Name</Label>
                    <Input
                      id="ownerName"
                      placeholder="Search by Owner Name"
                      value={filters.ownerName}
                      onChange={(e) => handleFilterChange("ownerName", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="corporateName">Corporate Name</Label>
                    <Select
                      value={filters.corporateName}
                      onValueChange={(value) => handleFilterChange("corporateName", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Corporate Name" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Corporate Names</SelectItem>
                        {corporateNames.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ward">Ward</Label>
                    <Select
                      value={filters.ward}
                      onValueChange={(value) => handleFilterChange("ward", value)}
                      disabled={!filters.corporateName}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Ward" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Wards</SelectItem>
                        {getAvailableWards().map((ward) => (
                          <SelectItem key={ward} value={ward}>
                            {ward}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mohalla">Mohalla</Label>
                    <Select
                      value={filters.mohalla}
                      onValueChange={(value) => handleFilterChange("mohalla", value)}
                      disabled={!filters.ward}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Mohalla" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Mohallas</SelectItem>
                        {getAvailableMohallas().map((mohalla) => (
                          <SelectItem key={mohalla} value={mohalla}>
                            {mohalla}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="propertyType">Property Type</Label>
                    <Select
                      value={filters.propertyType}
                      onValueChange={(value) => handleFilterChange("propertyType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Residential">Residential</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="Mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryStatus">Delivery Status</Label>
                    <Select
                      value={filters.deliveryStatus}
                      onValueChange={(value) => handleFilterChange("deliveryStatus", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Delivered">Delivered</SelectItem>
                        <SelectItem value="Not Found">Not Found</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Options</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="undeliveredOnly"
                        checked={filters.undeliveredOnly}
                        onCheckedChange={(checked) => handleFilterChange("undeliveredOnly", checked as boolean)}
                      />
                      <Label htmlFor="undeliveredOnly" className="text-sm">
                        Show only undelivered properties
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-end">
                    <Button onClick={resetFilters} variant="outline" size="sm">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Column Visibility Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Column Visibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showCorporateInfo"
                      checked={columnVisibility.corporateInfo}
                      onCheckedChange={(checked) =>
                        setColumnVisibility((prev) => ({ ...prev, corporateInfo: checked as boolean }))
                      }
                    />
                    <Label htmlFor="showCorporateInfo">Corporate Information</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showPropertyDetails"
                      checked={columnVisibility.propertyDetails}
                      onCheckedChange={(checked) =>
                        setColumnVisibility((prev) => ({ ...prev, propertyDetails: checked as boolean }))
                      }
                    />
                    <Label htmlFor="showPropertyDetails">Property Details</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showContactInfo"
                      checked={columnVisibility.contactInfo}
                      onCheckedChange={(checked) =>
                        setColumnVisibility((prev) => ({ ...prev, contactInfo: checked as boolean }))
                      }
                    />
                    <Label htmlFor="showContactInfo">Contact Information</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showDeliveryInfo"
                      checked={columnVisibility.deliveryInfo}
                      onCheckedChange={(checked) =>
                        setColumnVisibility((prev) => ({ ...prev, deliveryInfo: checked as boolean }))
                      }
                    />
                    <Label htmlFor="showDeliveryInfo">Delivery Information</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Properties Table */}
            <Card>
              <CardContent className="p-0">
                {filteredProperties.length === 0 ? (
                  <div className="p-8 text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Properties Found</h3>
                    <p className="text-muted-foreground">
                      No properties match your current filter criteria. Try adjusting your filters.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="sticky left-0 bg-background">Property ID</TableHead>
                            <TableHead>Owner Name</TableHead>
                            {columnVisibility.corporateInfo && (
                              <>
                                <TableHead>Corporate Name</TableHead>
                                <TableHead>Ward</TableHead>
                                <TableHead>Mohalla</TableHead>
                              </>
                            )}
                            {columnVisibility.propertyDetails && (
                              <>
                                <TableHead>Property Type</TableHead>
                                <TableHead>House No.</TableHead>
                                <TableHead>Address</TableHead>
                              </>
                            )}
                            <TableHead>Delivery Status</TableHead>
                            {columnVisibility.contactInfo && <TableHead>Mobile Number</TableHead>}
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedProperties.map((property) => (
                            <TableRow
                              key={property._id}
                              className="hover:bg-muted/50 cursor-pointer"
                              onClick={() => handleRowClick(property)}
                            >
                              <TableCell className="sticky left-0 bg-background font-medium">
                                <div className="flex items-center gap-2">
                                  {property.deliveryStatus === 'Pending' && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Delivery pending</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  <div>
                                    <div className="font-semibold">{property.propertyId}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <span>{truncateText(property.ownerName, 20)}</span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{property.ownerName}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              {columnVisibility.corporateInfo && (
                                <>
                                  <TableCell>
                                    <div className="text-sm">
                                      <div className="font-medium">{property.ward.corporateName}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{property.ward.wardName}</TableCell>
                                  <TableCell>{property.mohalla}</TableCell>
                                </>
                              )}
                              {columnVisibility.propertyDetails && (
                                <>
                                  <TableCell>
                                    <Badge variant="outline">{property.propertyType || "N/A"}</Badge>
                                  </TableCell>
                                  <TableCell>{property.houseNo || "N/A"}</TableCell>
                                  <TableCell>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <span>{truncateText(property.address, 25)}</span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{property.address}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TableCell>
                                </>
                              )}
                              <TableCell>
                                <Badge 
                                  variant={
                                    property.deliveryStatus === 'Delivered' ? "default" : 
                                    property.deliveryStatus === 'Not Found' ? "destructive" : "secondary"
                                  }
                                >
                                  {property.deliveryStatus}
                                </Badge>
                              </TableCell>
                              {columnVisibility.contactInfo && (
                                <TableCell>
                                  <div className="text-sm">
                                    {property.mobileNo || "N/A"}
                                  </div>
                                </TableCell>
                              )}
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRowClick(property)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredProperties.length)}{" "}
                          of {filteredProperties.length} properties
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <span className="text-sm">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Property Detail Drawer */}
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerContent className="max-h-[90vh]">
                <DrawerHeader>
                  <DrawerTitle>Property Details</DrawerTitle>
                </DrawerHeader>

                {editForm && (
                  <div className="p-4 space-y-6 overflow-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-property-id">Property ID</Label>
                        <Input id="edit-property-id" value={editForm.propertyId} disabled className="bg-muted" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-corporate-name">Corporate Name</Label>
                        <Input
                          id="edit-corporate-name"
                          value={editForm.ward.corporateName}
                          disabled
                          className="bg-muted"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-ward">Ward</Label>
                        <Input
                          id="edit-ward"
                          value={editForm.ward.wardName}
                          disabled
                          className="bg-muted"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-mohalla">Mohalla</Label>
                        <Input
                          id="edit-mohalla"
                          value={editForm.mohalla}
                          onChange={(e) => setEditForm((prev) => prev ? { ...prev, mohalla: e.target.value } : null)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-owner-name">Owner Name</Label>
                        <Input
                          id="edit-owner-name"
                          value={editForm.ownerName}
                          onChange={(e) => setEditForm((prev) => prev ? { ...prev, ownerName: e.target.value } : null)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-father-name">Father Name</Label>
                        <Input
                          id="edit-father-name"
                          value={editForm.fatherName || ""}
                          onChange={(e) => setEditForm((prev) => prev ? { ...prev, fatherName: e.target.value } : null)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-house-no">House No.</Label>
                        <Input
                          id="edit-house-no"
                          value={editForm.houseNo || ""}
                          onChange={(e) => setEditForm((prev) => prev ? { ...prev, houseNo: e.target.value } : null)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-property-type">Property Type</Label>
                        <Input
                          id="edit-property-type"
                          value={editForm.propertyType || ""}
                          onChange={(e) => setEditForm((prev) => prev ? { ...prev, propertyType: e.target.value } : null)}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="edit-address">Address</Label>
                        <Input
                          id="edit-address"
                          value={editForm.address}
                          onChange={(e) => setEditForm((prev) => prev ? { ...prev, address: e.target.value } : null)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-mobile-no">Mobile Number</Label>
                        <Input
                          id="edit-mobile-no"
                          value={editForm.mobileNo || ""}
                          onChange={(e) => setEditForm((prev) => prev ? { ...prev, mobileNo: e.target.value } : null)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Delivery Status</Label>
                        <Badge variant={
                          editForm.deliveryStatus === 'Delivered' ? "default" : 
                          editForm.deliveryStatus === 'Not Found' ? "destructive" : "secondary"
                        }>
                          {editForm.deliveryStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                <DrawerFooter>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProperty} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <DrawerClose asChild>
                      <Button variant="outline" className="flex-1 bg-transparent">
                        Cancel
                      </Button>
                    </DrawerClose>
                  </div>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        </TooltipProvider>
      </AdminLayout>
    </AuthGuard>
  )
}
