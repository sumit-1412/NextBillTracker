"use client"

import { useState, useEffect, useMemo } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useToast } from "@/hooks/use-toast"
import {
  Download,
  Search,
  Filter,
  RefreshCw,
  Eye,
  MapPin,
  Camera,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Edit3,
  FileText,
  Home,
  ArrowRight,
} from "lucide-react"
import { apiService } from "@/lib/api"

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

// Mock Data
const mockZones = [
  { id: "zone-a", name: "Zone A" },
  { id: "zone-b", name: "Zone B" },
  { id: "zone-c", name: "Zone C" },
  { id: "zone-d", name: "Zone D" },
]

const mockWards = {
  "zone-a": [
    { id: "ward-1a", name: "Ward 1A" },
    { id: "ward-1b", name: "Ward 1B" },
    { id: "ward-1c", name: "Ward 1C" },
  ],
  "zone-b": [
    { id: "ward-2a", name: "Ward 2A" },
    { id: "ward-2b", name: "Ward 2B" },
    { id: "ward-2c", name: "Ward 2C" },
  ],
  "zone-c": [
    { id: "ward-3a", name: "Ward 3A" },
    { id: "ward-3b", name: "Ward 3B" },
    { id: "ward-3c", name: "Ward 3C" },
  ],
  "zone-d": [
    { id: "ward-4a", name: "Ward 4A" },
    { id: "ward-4b", name: "Ward 4B" },
    { id: "ward-4c", name: "Ward 4C" },
  ],
}

const mockStaff = ["Ravi Kumar", "Priya Sharma", "Sunita Devi", "Vikram Gupta", "Meera Patel", "Rajesh Yadav"]

const mockFieldNames = ["owner_name", "address", "mobile_1", "mobile_2", "payment_status", "zone", "ward", "mohalla"]

// Mock corrections data - field-wise view
const mockFieldCorrections = [
  {
    id: "CORR001",
    property_id: "P001",
    owner_name: "Kavita Sharma",
    zone: "Zone A",
    ward: "Ward 1A",
    field_name: "mobile_1",
    old_value: "9876543200",
    new_value: "9876543210",
    corrected_by: "Ravi Kumar",
    submitted_at: "2025-06-30T10:32:00Z",
    delivery_id: "DEL001",
  },
  {
    id: "CORR002",
    property_id: "P001",
    owner_name: "Kavita Sharma",
    zone: "Zone A",
    ward: "Ward 1A",
    field_name: "owner_name",
    old_value: "Kavita Singh",
    new_value: "Kavita Sharma",
    corrected_by: "Ravi Kumar",
    submitted_at: "2025-06-30T10:32:00Z",
    delivery_id: "DEL001",
  },
  {
    id: "CORR003",
    property_id: "P003",
    owner_name: "Amit Singh",
    zone: "Zone C",
    ward: "Ward 3A",
    field_name: "address",
    old_value: "789 Garden Road, Phase 1",
    new_value: "789 Garden Road, Phase 2, Gurgaon",
    corrected_by: "Sunita Devi",
    submitted_at: "2025-06-29T16:45:00Z",
    delivery_id: "DEL003",
  },
  {
    id: "CORR004",
    property_id: "P006",
    owner_name: "Neha Gupta",
    zone: "Zone B",
    ward: "Ward 2B",
    field_name: "payment_status",
    old_value: "Paid",
    new_value: "Unpaid",
    corrected_by: "Priya Sharma",
    submitted_at: "2025-06-29T14:20:00Z",
    delivery_id: "DEL006",
  },
  {
    id: "CORR005",
    property_id: "P007",
    owner_name: "Rohit Verma",
    zone: "Zone D",
    ward: "Ward 4A",
    field_name: "mobile_2",
    old_value: "",
    new_value: "9876543299",
    corrected_by: "Vikram Gupta",
    submitted_at: "2025-06-28T11:15:00Z",
    delivery_id: "DEL007",
  },
  // Add more mock data
  ...Array.from({ length: 25 }, (_, i) => ({
    id: `CORR${String(i + 6).padStart(3, "0")}`,
    property_id: `P${String(i + 8).padStart(3, "0")}`,
    owner_name: `Owner ${i + 8}`,
    zone: mockZones[Math.floor(Math.random() * mockZones.length)].name,
    ward: `Ward ${Math.floor(Math.random() * 3) + 1}${String.fromCharCode(65 + Math.floor(Math.random() * 3))}`,
    field_name: mockFieldNames[Math.floor(Math.random() * mockFieldNames.length)],
    old_value: `Old Value ${i + 1}`,
    new_value: `New Value ${i + 1}`,
    corrected_by: mockStaff[Math.floor(Math.random() * mockStaff.length)],
    submitted_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    delivery_id: `DEL${String(i + 8).padStart(3, "0")}`,
  })),
]

// Mock submissions data - grouped by delivery
const mockSubmissionCorrections = [
  {
    delivery_id: "DEL001",
    property_id: "P001",
    owner_name: "Kavita Sharma",
    zone: "Zone A",
    ward: "Ward 1A",
    corrected_by: "Ravi Kumar",
    submitted_at: "2025-06-30T10:32:00Z",
    corrections_count: 2,
    corrections: [
      {
        field_name: "mobile_1",
        old_value: "9876543200",
        new_value: "9876543210",
      },
      {
        field_name: "owner_name",
        old_value: "Kavita Singh",
        new_value: "Kavita Sharma",
      },
    ],
    photo_url: "/placeholder.svg?height=400&width=600",
    gps: { lat: 28.613939, lng: 77.209023 },
    address: "123 Main Street, Sector 15",
  },
  {
    delivery_id: "DEL003",
    property_id: "P003",
    owner_name: "Amit Singh",
    zone: "Zone C",
    ward: "Ward 3A",
    corrected_by: "Sunita Devi",
    submitted_at: "2025-06-29T16:45:00Z",
    corrections_count: 1,
    corrections: [
      {
        field_name: "address",
        old_value: "789 Garden Road, Phase 1",
        new_value: "789 Garden Road, Phase 2, Gurgaon",
      },
    ],
    photo_url: "/placeholder.svg?height=400&width=600",
    gps: { lat: 28.459497, lng: 77.028046 },
    address: "789 Garden Road, Phase 2, Gurgaon",
  },
  // Add more grouped submissions
  ...Array.from({ length: 15 }, (_, i) => ({
    delivery_id: `DEL${String(i + 10).padStart(3, "0")}`,
    property_id: `P${String(i + 10).padStart(3, "0")}`,
    owner_name: `Owner ${i + 10}`,
    zone: mockZones[Math.floor(Math.random() * mockZones.length)].name,
    ward: `Ward ${Math.floor(Math.random() * 3) + 1}${String.fromCharCode(65 + Math.floor(Math.random() * 3))}`,
    corrected_by: mockStaff[Math.floor(Math.random() * mockStaff.length)],
    submitted_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    corrections_count: Math.floor(Math.random() * 3) + 1,
    corrections: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, j) => ({
      field_name: mockFieldNames[Math.floor(Math.random() * mockFieldNames.length)],
      old_value: `Old Value ${j + 1}`,
      new_value: `New Value ${j + 1}`,
    })),
    photo_url: "/placeholder.svg?height=400&width=600",
    gps: { lat: 28.6 + Math.random() * 0.1, lng: 77.2 + Math.random() * 0.1 },
    address: `Address ${i + 10}, Sector ${Math.floor(Math.random() * 50) + 1}`,
  })),
]

type FieldCorrection = (typeof mockFieldCorrections)[0]
type SubmissionCorrection = (typeof mockSubmissionCorrections)[0]

export default function AdminCorrections() {
  const { toast } = useToast()

  // State Management
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [viewMode, setViewMode] = useState("field")
  const [fieldCorrections, setFieldCorrections] = useState<FieldCorrection[]>([])
  const [submissionCorrections, setSubmissionCorrections] = useState<SubmissionCorrection[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionCorrection | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Filter State
  const [filters, setFilters] = useState({
    dateRange: "all",
    staffName: "all",
    zone: "all",
    ward: "all",
    fieldName: "all",
    propertyId: "",
    ownerName: "",
  })

  // Available wards based on selected zone
  const availableWards = useMemo(() => {
    if (filters.zone === "all") return []
    const zoneKey = mockZones.find((z) => z.name === filters.zone)?.id
    return zoneKey ? mockWards[zoneKey as keyof typeof mockWards] || [] : []
  }, [filters.zone])

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError("")

      try {
        const response = await apiService.getDeliveries()
        const deliveries: Delivery[] = response.deliveries
        
        // Filter deliveries that have corrections
        const correctedDeliveries = deliveries.filter(d => d.correctionStatus !== 'None')
        
        // Transform to field corrections format
        const fieldCorrections = correctedDeliveries.map(delivery => ({
          id: delivery._id,
          property_id: delivery.property.propertyId,
          owner_name: delivery.property.ownerName,
          zone: delivery.property.ward.corporateName,
          ward: delivery.property.ward.wardName,
          field_name: 'delivery_status', // Default field for corrections
          old_value: 'Pending',
          new_value: delivery.dataSource === 'not_found' ? 'Not Found' : 'Delivered',
          corrected_by: delivery.staff.fullName,
          submitted_at: delivery.deliveryDate,
          delivery_id: delivery._id,
        }))

        // Transform to submission corrections format
        const submissionCorrections = correctedDeliveries.map(delivery => ({
          delivery_id: delivery._id,
          property_id: delivery.property.propertyId,
          owner_name: delivery.property.ownerName,
          zone: delivery.property.ward.corporateName,
          ward: delivery.property.ward.wardName,
          corrected_by: delivery.staff.fullName,
          submitted_at: delivery.deliveryDate,
          corrections_count: 1,
          corrections: [{
            field_name: 'delivery_status',
            old_value: 'Pending',
            new_value: delivery.dataSource === 'not_found' ? 'Not Found' : 'Delivered',
          }],
          photo_url: delivery.photoUrl,
          gps: { 
            lat: delivery.location.coordinates[1], 
            lng: delivery.location.coordinates[0] 
          },
          address: delivery.property.address,
        }))

        setFieldCorrections(fieldCorrections)
        setSubmissionCorrections(submissionCorrections)
        
        toast({
          title: "Corrections Loaded",
          description: `Found ${fieldCorrections.length} field corrections across ${submissionCorrections.length} submissions.`,
        })
      } catch (err) {
        setError("Failed to load corrections. Please try again.")
        toast({
          title: "Error Loading Data",
          description: "Failed to fetch correction records.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  // Filter corrections
  const filteredFieldCorrections = useMemo(() => {
    let filtered = [...fieldCorrections]

    // Apply filters
    if (filters.dateRange !== "all") {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

      filtered = filtered.filter((correction) => {
        const correctionDate = new Date(correction.submitted_at)
        if (filters.dateRange === "today") {
          return correctionDate >= today
        } else if (filters.dateRange === "week") {
          return correctionDate >= weekAgo
        }
        return true
      })
    }

    if (filters.staffName !== "all") {
      filtered = filtered.filter((correction) => correction.corrected_by === filters.staffName)
    }

    if (filters.zone !== "all") {
      filtered = filtered.filter((correction) => correction.zone === filters.zone)
    }

    if (filters.ward !== "all") {
      filtered = filtered.filter((correction) => correction.ward === filters.ward)
    }

    if (filters.fieldName !== "all") {
      filtered = filtered.filter((correction) => correction.field_name === filters.fieldName)
    }

    if (filters.propertyId.trim()) {
      filtered = filtered.filter((correction) =>
        correction.property_id.toLowerCase().includes(filters.propertyId.toLowerCase()),
      )
    }

    if (filters.ownerName.trim()) {
      filtered = filtered.filter((correction) =>
        correction.owner_name.toLowerCase().includes(filters.ownerName.toLowerCase()),
      )
    }

    return filtered.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
  }, [fieldCorrections, filters])

  const filteredSubmissionCorrections = useMemo(() => {
    let filtered = [...submissionCorrections]

    // Apply same filters to submission view
    if (filters.dateRange !== "all") {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

      filtered = filtered.filter((submission) => {
        const submissionDate = new Date(submission.submitted_at)
        if (filters.dateRange === "today") {
          return submissionDate >= today
        } else if (filters.dateRange === "week") {
          return submissionDate >= weekAgo
        }
        return true
      })
    }

    if (filters.staffName !== "all") {
      filtered = filtered.filter((submission) => submission.corrected_by === filters.staffName)
    }

    if (filters.zone !== "all") {
      filtered = filtered.filter((submission) => submission.zone === filters.zone)
    }

    if (filters.ward !== "all") {
      filtered = filtered.filter((submission) => submission.ward === filters.ward)
    }

    if (filters.fieldName !== "all") {
      filtered = filtered.filter((submission) =>
        submission.corrections.some((corr) => corr.field_name === filters.fieldName),
      )
    }

    if (filters.propertyId.trim()) {
      filtered = filtered.filter((submission) =>
        submission.property_id.toLowerCase().includes(filters.propertyId.toLowerCase()),
      )
    }

    if (filters.ownerName.trim()) {
      filtered = filtered.filter((submission) =>
        submission.owner_name.toLowerCase().includes(filters.ownerName.toLowerCase()),
      )
    }

    return filtered.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
  }, [submissionCorrections, filters])

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      // Reset ward when zone changes
      if (key === "zone") {
        newFilters.ward = "all"
      }
      return newFilters
    })
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      dateRange: "all",
      staffName: "all",
      zone: "all",
      ward: "all",
      fieldName: "all",
      propertyId: "",
      ownerName: "",
    })
    toast({
      title: "Filters Reset",
      description: "All filters have been cleared.",
    })
  }

  // Export to CSV
  const handleExport = () => {
    const dataToExport = viewMode === "field" ? filteredFieldCorrections : filteredSubmissionCorrections

    console.log("Exporting corrections data:", dataToExport)
    toast({
      title: "Export Started",
      description: `Exporting ${dataToExport.length} correction records...`,
    })

    // Mock CSV download
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: "Corrections data has been exported successfully.",
      })
    }, 2000)
  }

  // View submission details
  const handleViewSubmission = (submission: SubmissionCorrection) => {
    setSelectedSubmission(submission)
    setDrawerOpen(true)
    toast({
      title: "Opening Details",
      description: `Loading details for ${submission.property_id}`,
    })
  }

  // Toggle row expansion
  const toggleRowExpansion = (deliveryId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(deliveryId)) {
      newExpanded.delete(deliveryId)
    } else {
      newExpanded.add(deliveryId)
    }
    setExpandedRows(newExpanded)
  }

  // Open GPS in Google Maps
  const openInMaps = (gps: { lat: number; lng: number }) => {
    const url = `https://www.google.com/maps?q=${gps.lat},${gps.lng}`
    window.open(url, "_blank")
    toast({
      title: "Opening Maps",
      description: "Redirecting to Google Maps...",
    })
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Format field name for display
  const formatFieldName = (fieldName: string) => {
    return fieldName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  // Retry loading
  const retryLoading = () => {
    setError("")
    setLoading(true)
    setTimeout(() => {
      setFieldCorrections(mockFieldCorrections)
      setSubmissionCorrections(mockSubmissionCorrections)
      setLoading(false)
      toast({
        title: "Data Refreshed",
        description: "Correction records have been reloaded.",
      })
    }, 1000)
  }

  // Loading skeleton
  const TableSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Corrections Report</h1>
              <p className="text-muted-foreground">Track all form corrections made by field staff</p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleExport}
                    disabled={
                      loading ||
                      (viewMode === "field"
                        ? filteredFieldCorrections.length === 0
                        : filteredSubmissionCorrections.length === 0)
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export to CSV
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export filtered corrections</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* View Toggle */}
          <Card>
            <CardHeader>
              <CardTitle>View Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={viewMode} onValueChange={setViewMode}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="field">Field-wise View</TabsTrigger>
                  <TabsTrigger value="submission">Submission-wise View</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          {/* Filter Bar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Date Range */}
                <div>
                  <Label htmlFor="date-range">Date Range</Label>
                  <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange("dateRange", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Staff Name */}
                <div>
                  <Label htmlFor="staff-name">Staff Name</Label>
                  <Select value={filters.staffName} onValueChange={(value) => handleFilterChange("staffName", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Staff</SelectItem>
                      {mockStaff.map((staff) => (
                        <SelectItem key={staff} value={staff}>
                          {staff}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Zone */}
                <div>
                  <Label htmlFor="zone">Zone</Label>
                  <Select value={filters.zone} onValueChange={(value) => handleFilterChange("zone", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All zones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Zones</SelectItem>
                      {mockZones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.name}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ward */}
                <div>
                  <Label htmlFor="ward">Ward</Label>
                  <Select
                    value={filters.ward}
                    onValueChange={(value) => handleFilterChange("ward", value)}
                    disabled={filters.zone === "all"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All wards" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Wards</SelectItem>
                      {availableWards.map((ward) => (
                        <SelectItem key={ward.id} value={ward.name}>
                          {ward.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Field Name */}
                <div>
                  <Label htmlFor="field-name">Field Name</Label>
                  <Select value={filters.fieldName} onValueChange={(value) => handleFilterChange("fieldName", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All fields" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Fields</SelectItem>
                      {mockFieldNames.map((field) => (
                        <SelectItem key={field} value={field}>
                          {formatFieldName(field)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Property ID */}
                <div>
                  <Label htmlFor="property-id">Property ID</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="property-id"
                      placeholder="Search property ID..."
                      value={filters.propertyId}
                      onChange={(e) => handleFilterChange("propertyId", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Owner Name */}
                <div>
                  <Label htmlFor="owner-name">Owner Name</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="owner-name"
                      placeholder="Search owner..."
                      value={filters.ownerName}
                      onChange={(e) => handleFilterChange("ownerName", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Reset Button */}
                <div className="flex items-end">
                  <Button variant="outline" onClick={resetFilters} className="w-full bg-transparent">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Filters
                  </Button>
                </div>
              </div>

              {/* Active Filters Summary */}
              {Object.values(filters).some((value) => value !== "all" && value !== "") && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    Showing{" "}
                    {viewMode === "field" ? filteredFieldCorrections.length : filteredSubmissionCorrections.length}{" "}
                    results
                  </p>
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
                <Button variant="outline" size="sm" onClick={retryLoading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Data Tables */}
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsContent value="field">
              <Card>
                <CardHeader>
                  <CardTitle>Field-wise Corrections</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <TableSkeleton />
                  ) : filteredFieldCorrections.length === 0 ? (
                    <div className="text-center py-8">
                      <Edit3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No corrections found</h3>
                      <p className="text-muted-foreground mb-4">
                        {fieldCorrections.length === 0
                          ? "No field corrections available."
                          : "No corrections match your current filters."}
                      </p>
                      {fieldCorrections.length > 0 && (
                        <Button variant="outline" onClick={resetFilters}>
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background">
                          <TableRow>
                            <TableHead>Property ID</TableHead>
                            <TableHead>Owner Name</TableHead>
                            <TableHead>Zone → Ward</TableHead>
                            <TableHead>Corrected By</TableHead>
                            <TableHead>Field Changed</TableHead>
                            <TableHead>Old Value → New Value</TableHead>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredFieldCorrections.map((correction) => (
                            <TableRow key={correction.id} className="hover:bg-accent">
                              <TableCell className="font-medium">{correction.property_id}</TableCell>
                              <TableCell>{correction.owner_name}</TableCell>
                              <TableCell>
                                {correction.zone} → {correction.ward}
                              </TableCell>
                              <TableCell>{correction.corrected_by}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{formatFieldName(correction.field_name)}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-sm text-muted-foreground line-through">
                                    {correction.old_value || "(empty)"}
                                  </div>
                                  <div className="text-sm font-semibold">
                                    <ArrowRight className="h-3 w-3 inline mr-1" />
                                    {correction.new_value}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">{formatDate(correction.submitted_at)}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Find the submission for this correction
                                    const submission = submissionCorrections.find(
                                      (sub) => sub.delivery_id === correction.delivery_id,
                                    )
                                    if (submission) {
                                      handleViewSubmission(submission)
                                    }
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
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submission">
              <Card>
                <CardHeader>
                  <CardTitle>Submission-wise Corrections</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <TableSkeleton />
                  ) : filteredSubmissionCorrections.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No submissions found</h3>
                      <p className="text-muted-foreground mb-4">
                        {submissionCorrections.length === 0
                          ? "No corrected submissions available."
                          : "No submissions match your current filters."}
                      </p>
                      {submissionCorrections.length > 0 && (
                        <Button variant="outline" onClick={resetFilters}>
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredSubmissionCorrections.map((submission) => (
                        <Collapsible key={submission.delivery_id}>
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <p className="font-medium">{submission.property_id}</p>
                                    <p className="text-sm text-muted-foreground">{submission.owner_name}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm">
                                      {submission.zone} → {submission.ward}
                                    </p>
                                    <p className="text-sm text-muted-foreground">By {submission.corrected_by}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm">{formatDate(submission.submitted_at)}</p>
                                  </div>
                                  <Badge variant="destructive">
                                    <Edit3 className="h-3 w-3 mr-1" />
                                    {submission.corrections_count} Correction
                                    {submission.corrections_count > 1 ? "s" : ""}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <CollapsibleTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleRowExpansion(submission.delivery_id)}
                                    >
                                      {expandedRows.has(submission.delivery_id) ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                      Expand
                                    </Button>
                                  </CollapsibleTrigger>
                                  <Button variant="ghost" size="sm" onClick={() => handleViewSubmission(submission)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <CollapsibleContent className="mt-4">
                                <div className="border-t pt-4">
                                  <h4 className="font-medium mb-3">Corrections Made:</h4>
                                  <div className="space-y-3">
                                    {submission.corrections.map((correction, index) => (
                                      <div key={index} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                                        <Badge variant="outline" className="shrink-0">
                                          {formatFieldName(correction.field_name)}
                                        </Badge>
                                        <div className="flex-1">
                                          <div className="text-sm text-muted-foreground line-through">
                                            {correction.old_value || "(empty)"}
                                          </div>
                                          <div className="text-sm font-semibold">
                                            <ArrowRight className="h-3 w-3 inline mr-1" />
                                            {correction.new_value}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </CardContent>
                          </Card>
                        </Collapsible>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Correction Detail Drawer */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Correction Details - {selectedSubmission?.property_id}</SheetTitle>
              </SheetHeader>
              {selectedSubmission && (
                <div className="space-y-6 mt-6">
                  {/* Metadata */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Home className="h-5 w-5" />
                        Property Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Property ID</Label>
                          <p className="font-semibold">{selectedSubmission.property_id}</p>
                        </div>
                        <div>
                          <Label>Owner Name</Label>
                          <p className="font-semibold">{selectedSubmission.owner_name}</p>
                        </div>
                        <div>
                          <Label>Zone → Ward</Label>
                          <p className="font-semibold">
                            {selectedSubmission.zone} → {selectedSubmission.ward}
                          </p>
                        </div>
                        <div>
                          <Label>Corrected By</Label>
                          <p className="font-semibold">{selectedSubmission.corrected_by}</p>
                        </div>
                      </div>
                      <div>
                        <Label>Address</Label>
                        <p className="font-semibold">{selectedSubmission.address}</p>
                      </div>
                      <div>
                        <Label>Submitted At</Label>
                        <p className="font-semibold">{formatDate(selectedSubmission.submitted_at)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Corrections */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Edit3 className="h-5 w-5 text-orange-600" />
                        Corrections Made
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Field</TableHead>
                              <TableHead>Old Value</TableHead>
                              <TableHead>New Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedSubmission.corrections.map((correction, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Badge variant="outline">{formatFieldName(correction.field_name)}</Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground line-through">
                                  {correction.old_value || "(empty)"}
                                </TableCell>
                                <TableCell className="font-semibold">{correction.new_value}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Photo */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Delivery Photo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <img
                        src={selectedSubmission.photo_url || "/placeholder.svg"}
                        alt={`Delivery photo for ${selectedSubmission.property_id}`}
                        className="w-full max-w-md h-64 object-cover rounded-lg border"
                      />
                    </CardContent>
                  </Card>

                  {/* Location */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        GPS Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Latitude</Label>
                          <p className="font-mono">{selectedSubmission.gps.lat.toFixed(6)}</p>
                        </div>
                        <div>
                          <Label>Longitude</Label>
                          <p className="font-mono">{selectedSubmission.gps.lng.toFixed(6)}</p>
                        </div>
                      </div>
                      <Button onClick={() => openInMaps(selectedSubmission.gps)} className="w-full">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in Google Maps
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
