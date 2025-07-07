"use client"

import { useState, useEffect, useMemo } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { StaffLayout } from "@/components/staff-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  Edit3,
  Eye,
  RefreshCw,
  AlertCircle,
  Package,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { apiService, getPhotoUrl } from "@/lib/api"

// Types for API data
interface APIDelivery {
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

// Mock delivery data based on schema
const mockDeliveries = [
  {
    id: "DEL001",
    property_id: "PROP001",
    owner_name: "Rajesh Kumar",
    address: "123 Main Street, Sector 15",
    paid: true,
    was_corrected: false,
    submitted_at: "2024-01-15T10:30:00Z",
    photo_url: "/placeholder.svg?height=64&width=64",
    zone_name: "Zone A",
    ward_name: "Ward 1A",
    mohalla_name: "Mohalla 1A-1",
  },
  {
    id: "DEL002",
    property_id: "PROP002",
    owner_name: "Priya Sharma",
    address: "456 Park Avenue, Block B",
    paid: false,
    was_corrected: true,
    submitted_at: "2024-01-14T15:45:00Z",
    photo_url: "/placeholder.svg?height=64&width=64",
    zone_name: "Zone B",
    ward_name: "Ward 2A",
    mohalla_name: "Mohalla 2A-1",
  },
  {
    id: "DEL003",
    property_id: "PROP003",
    owner_name: "Amit Singh",
    address: "789 Garden Road, Phase 2",
    paid: true,
    was_corrected: false,
    submitted_at: "2024-01-13T09:15:00Z",
    photo_url: "/placeholder.svg?height=64&width=64",
    zone_name: "Zone C",
    ward_name: "Ward 3A",
    mohalla_name: "Mohalla 3A-1",
  },
  {
    id: "DEL004",
    property_id: "PROP004",
    owner_name: "Sunita Devi",
    address: "321 Market Street, Old City",
    paid: false,
    was_corrected: true,
    submitted_at: "2024-01-12T14:20:00Z",
    photo_url: "/placeholder.svg?height=64&width=64",
    zone_name: "Zone A",
    ward_name: "Ward 1B",
    mohalla_name: "Mohalla 1B-1",
  },
  {
    id: "DEL005",
    property_id: "PROP005",
    owner_name: "Vikram Gupta",
    address: "654 Hill View, Sector 22",
    paid: true,
    was_corrected: false,
    submitted_at: "2024-01-11T11:30:00Z",
    photo_url: "/placeholder.svg?height=64&width=64",
    zone_name: "Zone B",
    ward_name: "Ward 2B",
    mohalla_name: "Mohalla 2B-2",
  },
]

type Delivery = (typeof mockDeliveries)[0]

export default function StaffHistory() {
  const { toast } = useToast()
  const router = useRouter()

  // State management
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")

  // Filter state
  const [filters, setFilters] = useState({
    propertyId: "",
    ownerName: "",
    paidStatus: "all", // all, paid, unpaid
    correctionStatus: "all", // all, corrected, original
    dateFilter: "all", // all, today, week
  })

  // Date filter buttons
  const dateFilterOptions = [
    { key: "all", label: "All Time" },
    { key: "today", label: "Today" },
    { key: "week", label: "Last 7 Days" },
  ]

  // Load data from API
  useEffect(() => {
    const fetchDeliveries = async () => {
      setIsLoading(true)
      setError("")

      try {
        console.log('Fetching staff history...')
        // Use the staff-history endpoint instead of general deliveries
        const response = await apiService.getStaffHistory()
        console.log('Staff history response:', response)
        const deliveries: APIDelivery[] = response.deliveries
        console.log('Deliveries array:', deliveries)

        // Transform to match the expected format
        const transformedDeliveries = deliveries.map((delivery: APIDelivery) => ({
          id: delivery._id,
          property_id: delivery.property?.propertyId || 'N/A',
          owner_name: delivery.property?.ownerName || 'N/A',
          address: delivery.property?.address || 'N/A',
          paid: delivery.dataSource !== 'not_found',
          was_corrected: delivery.correctionStatus !== 'None',
          submitted_at: delivery.deliveryDate,
          photo_url: getPhotoUrl(delivery.photoUrl),
          zone_name: delivery.property?.ward?.corporateName || 'N/A',
          ward_name: delivery.property?.ward?.wardName || 'N/A',
          mohalla_name: delivery.property?.mohalla || 'N/A',
        }))

        console.log('Transformed deliveries:', transformedDeliveries)
        setDeliveries(transformedDeliveries)
        setIsLoading(false)
        toast({
          title: "Deliveries Loaded",
          description: `Found ${transformedDeliveries.length} delivery records.`,
        })
      } catch (err) {
        console.error('Error fetching deliveries:', err)
        setError("Couldn't load deliveries. Please try again.")
        setIsLoading(false)
        toast({
          title: "Error Loading Data",
          description: "Failed to fetch delivery history.",
          variant: "destructive",
        })
      }
    }

    fetchDeliveries()
  }, [toast])

  // Filter deliveries based on current filters
  const filteredDeliveries = useMemo(() => {
    let filtered = [...deliveries]

    // Filter by property ID
    if (filters.propertyId.trim()) {
      filtered = filtered.filter((delivery) =>
        delivery.property_id.toLowerCase().includes(filters.propertyId.toLowerCase()),
      )
    }

    // Filter by owner name
    if (filters.ownerName.trim()) {
      filtered = filtered.filter((delivery) =>
        delivery.owner_name.toLowerCase().includes(filters.ownerName.toLowerCase()),
      )
    }

    // Filter by paid status
    if (filters.paidStatus !== "all") {
      filtered = filtered.filter((delivery) => (filters.paidStatus === "paid" ? delivery.paid : !delivery.paid))
    }

    // Filter by correction status
    if (filters.correctionStatus !== "all") {
      filtered = filtered.filter((delivery) =>
        filters.correctionStatus === "corrected" ? delivery.was_corrected : !delivery.was_corrected,
      )
    }

    // Filter by date
    if (filters.dateFilter !== "all") {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

      filtered = filtered.filter((delivery) => {
        const deliveryDate = new Date(delivery.submitted_at)

        if (filters.dateFilter === "today") {
          return deliveryDate >= today
        } else if (filters.dateFilter === "week") {
          return deliveryDate >= weekAgo
        }
        return true
      })
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
  }, [deliveries, filters])

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    console.log(`Filter changed: ${key} = ${value}`)
  }

  // Handle delivery card click
  const handleDeliveryClick = (delivery: Delivery) => {
    console.log("Opening delivery details:", delivery.id)
    router.push(`/staff/history/detail?id=${delivery.id}`)
    toast({
      title: "Opening Details",
      description: `Loading details for ${delivery.property_id}`,
    })
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Manual refresh function
  const handleRefresh = async () => {
    setIsLoading(true)
    setError("")

    try {
      // Use the staff-history endpoint instead of general deliveries
      const response = await apiService.getStaffHistory()
      const deliveries: APIDelivery[] = response.deliveries

      // Transform to match the expected format
      const transformedDeliveries = deliveries.map((delivery: APIDelivery) => ({
        id: delivery._id,
        property_id: delivery.property?.propertyId || 'N/A',
        owner_name: delivery.property?.ownerName || 'N/A',
        address: delivery.property?.address || 'N/A',
        paid: delivery.dataSource !== 'not_found',
        was_corrected: delivery.correctionStatus !== 'None',
        submitted_at: delivery.deliveryDate,
        photo_url: getPhotoUrl(delivery.photoUrl),
        zone_name: delivery.property?.ward?.corporateName || 'N/A',
        ward_name: delivery.property?.ward?.wardName || 'N/A',
        mohalla_name: delivery.property?.mohalla || 'N/A',
      }))

      setDeliveries(transformedDeliveries)
      setIsLoading(false)
      toast({
        title: "Data Refreshed",
        description: `Found ${transformedDeliveries.length} delivery records.`,
      })
    } catch (err) {
      setError("Couldn't load deliveries. Please try again.")
      setIsLoading(false)
      toast({
        title: "Error Loading Data",
        description: "Failed to fetch delivery history.",
        variant: "destructive",
      })
    }
  }

  // Skeleton loading component
  const SkeletonCard = () => (
    <Card className="p-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-16 w-16 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <Skeleton className="h-3 w-20" />
      </div>
    </Card>
  )

  return (
    <AuthGuard allowedRoles={["staff"]}>
      <StaffLayout>
        <div className="p-4 space-y-4 pb-20 overflow-auto h-full">
          <h2 className="text-xl font-semibold text-foreground">My Delivery History</h2>

          {/* Filter & Search Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Text Filters */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="filter-property-id">Property ID</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="filter-property-id"
                      placeholder="Search by Property ID"
                      value={filters.propertyId}
                      onChange={(e) => handleFilterChange("propertyId", e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="filter-owner-name">Owner Name</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="filter-owner-name"
                      placeholder="Search by Owner Name"
                      value={filters.ownerName}
                      onChange={(e) => handleFilterChange("ownerName", e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Dropdown Filters */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="filter-paid">Payment Status</Label>
                  <Select
                    value={filters.paidStatus}
                    onValueChange={(value) => handleFilterChange("paidStatus", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="filter-correction">Correction Status</Label>
                  <Select
                    value={filters.correctionStatus}
                    onValueChange={(value) => handleFilterChange("correctionStatus", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="corrected">Corrected</SelectItem>
                      <SelectItem value="original">Original</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date Filter Buttons */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  Date Range
                </Label>
                <div className="flex gap-2">
                  {dateFilterOptions.map((option) => (
                    <Button
                      key={option.key}
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange("dateFilter", option.key)}
                      disabled={isLoading}
                      className={`flex-1 ${
                        filters.dateFilter === option.key ? "bg-accent text-accent-foreground border-accent" : ""
                      }`}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Active Filters Summary */}
              {(filters.propertyId ||
                filters.ownerName ||
                filters.paidStatus !== "all" ||
                filters.correctionStatus !== "all" ||
                filters.dateFilter !== "all") && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Active Filters:</p>
                  <div className="flex flex-wrap gap-1">
                    {filters.propertyId && (
                      <Badge variant="secondary" className="text-xs">
                        ID: {filters.propertyId}
                      </Badge>
                    )}
                    {filters.ownerName && (
                      <Badge variant="secondary" className="text-xs">
                        Name: {filters.ownerName}
                      </Badge>
                    )}
                    {filters.paidStatus !== "all" && (
                      <Badge variant="secondary" className="text-xs">
                        {filters.paidStatus === "paid" ? "Paid" : "Unpaid"}
                      </Badge>
                    )}
                    {filters.correctionStatus !== "all" && (
                      <Badge variant="secondary" className="text-xs">
                        {filters.correctionStatus === "corrected" ? "Corrected" : "Original"}
                      </Badge>
                    )}
                    {filters.dateFilter !== "all" && (
                      <Badge variant="secondary" className="text-xs">
                        {dateFilterOptions.find((opt) => opt.key === filters.dateFilter)?.label}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredDeliveries.length === 0 && (
            <Card className="text-center p-6">
              <div className="space-y-3">
                <Package className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">
                  {deliveries.length === 0 ? "No deliveries yet" : "No matching deliveries"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {deliveries.length === 0
                    ? "Start submitting from the Home tab."
                    : "Try adjusting your filters to see more results."}
                </p>
                {deliveries.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFilters({
                        propertyId: "",
                        ownerName: "",
                        paidStatus: "all",
                        correctionStatus: "all",
                        dateFilter: "all",
                      })
                    }
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Delivery List */}
          {!isLoading && !error && filteredDeliveries.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredDeliveries.length} of {deliveries.length} deliveries
                </p>
                <Button variant="ghost" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {filteredDeliveries.map((delivery, index) => (
                <Card
                  key={delivery.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleDeliveryClick(delivery)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      {/* Property Photo */}
                      <img
                        src={delivery.photo_url || "/placeholder.svg"}
                        alt={`Property ${delivery.property_id}`}
                        className="w-16 h-16 rounded-md object-cover border"
                      />

                      {/* Delivery Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-foreground truncate">{delivery.property_id}</h3>
                          {index === 0 && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              Latest
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground truncate mb-2">{delivery.owner_name}</p>

                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={delivery.paid ? "default" : "destructive"} className="text-xs">
                            {delivery.paid ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Paid
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Unpaid
                              </>
                            )}
                          </Badge>

                          <Badge variant={delivery.was_corrected ? "secondary" : "outline"} className="text-xs">
                            {delivery.was_corrected ? (
                              <>
                                <Edit3 className="h-3 w-3 mr-1" />
                                Corrected
                              </>
                            ) : (
                              "Original"
                            )}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {delivery.zone_name} • {delivery.ward_name}
                        </p>
                      </div>

                      {/* Date and Action */}
                      <div className="flex flex-col items-end space-y-2">
                        <p className="text-xs text-muted-foreground text-right">{formatDate(delivery.submitted_at)}</p>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </StaffLayout>
    </AuthGuard>
  )
}
