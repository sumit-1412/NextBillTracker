"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  Download,
  Edit3,
  Check,
  X,
  FileText,
  Upload,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  DollarSign,
} from "lucide-react"
import { apiService } from "@/lib/api"

interface PayoutData {
  id: string
  name: string
  mobile: string
  zone: string
  ward: string
  deliveries: number
  paid: number
  corrected: number
  rate_per_form: number
  payout: number
  status: "Pending" | "Approved" | "Paid"
  last_submission: string
  remarks?: string
}

interface Filters {
  dateRange: string
  staffSearch: string
  zone: string
  ward: string
  status: string
  excludeCorrected: boolean
  onlyPaid: boolean
}

// Mock data
const mockPayouts: PayoutData[] = [
  {
    id: "1",
    name: "Ravi Kumar",
    mobile: "9876543210",
    zone: "Zone A",
    ward: "Ward 2",
    deliveries: 98,
    paid: 90,
    corrected: 5,
    rate_per_form: 10,
    payout: 900,
    status: "Pending",
    last_submission: "2025-06-29T12:43:00Z",
  },
  {
    id: "2",
    name: "Priya Sharma",
    mobile: "9123456789",
    zone: "Zone B",
    ward: "Ward 1",
    deliveries: 85,
    paid: 82,
    corrected: 2,
    rate_per_form: 12,
    payout: 984,
    status: "Approved",
    last_submission: "2025-06-29T14:20:00Z",
  },
  {
    id: "3",
    name: "Amit Singh",
    mobile: "9234567890",
    zone: "Zone A",
    ward: "Ward 3",
    deliveries: 76,
    paid: 76,
    corrected: 0,
    rate_per_form: 10,
    payout: 760,
    status: "Paid",
    last_submission: "2025-06-29T16:15:00Z",
  },
  {
    id: "4",
    name: "Sunita Devi",
    mobile: "9345678901",
    zone: "Zone C",
    ward: "Ward 4",
    deliveries: 92,
    paid: 88,
    corrected: 3,
    rate_per_form: 11,
    payout: 968,
    status: "Pending",
    last_submission: "2025-06-29T11:30:00Z",
  },
  {
    id: "5",
    name: "Rajesh Gupta",
    mobile: "9456789012",
    zone: "Zone B",
    ward: "Ward 2",
    deliveries: 67,
    paid: 65,
    corrected: 1,
    rate_per_form: 10,
    payout: 650,
    status: "Approved",
    last_submission: "2025-06-29T13:45:00Z",
  },
]

const zones = ["Zone A", "Zone B", "Zone C"]
const wards = {
  "Zone A": ["Ward 1", "Ward 2", "Ward 3"],
  "Zone B": ["Ward 1", "Ward 2", "Ward 4"],
  "Zone C": ["Ward 3", "Ward 4", "Ward 5"],
}

export default function AdminPayouts() {
  const { toast } = useToast()
  const [payouts, setPayouts] = useState<PayoutData[]>([])
  const [filteredPayouts, setFilteredPayouts] = useState<PayoutData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [globalRate, setGlobalRate] = useState(10)
  const [editingRate, setEditingRate] = useState<string | null>(null)
  const [tempRate, setTempRate] = useState("")
  const [adjustmentDrawerOpen, setAdjustmentDrawerOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<PayoutData | null>(null)
  const [paymentNote, setPaymentNote] = useState("")
  const [manualPayout, setManualPayout] = useState("")

  const [filters, setFilters] = useState<Filters>({
    dateRange: "all",
    staffSearch: "",
    zone: "",
    ward: "",
    status: "",
    excludeCorrected: false,
    onlyPaid: false,
  })

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [deliveriesResponse] = await Promise.all([
          apiService.getDeliveries(),
        ])

        const deliveries = deliveriesResponse.deliveries
        
        // Mock users data since getUsers doesn't exist
        const users = [
          { _id: "1", email: "staff1@example.com", fullName: "Staff One", role: "staff", isActive: true, mobileNo: "9876543210" },
          { _id: "2", email: "staff2@example.com", fullName: "Staff Two", role: "staff", isActive: true, mobileNo: "9876543211" },
        ]

        // Calculate payouts from deliveries data
        const payoutMap = new Map<string, PayoutData>()
        
        // Group deliveries by staff member
        deliveries.forEach((delivery: any) => {
          const staffId = delivery.staff._id || delivery.staff.fullName
          const staffName = delivery.staff.fullName
          
          if (!payoutMap.has(staffId)) {
            payoutMap.set(staffId, {
              id: staffId,
              name: staffName,
              mobile: delivery.staff.mobileNo || "N/A",
              zone: delivery.property.ward.corporateName,
              ward: delivery.property.ward.wardName,
              deliveries: 0,
              paid: 0,
              corrected: 0,
              rate_per_form: 10, // Default rate
              payout: 0,
              status: "Pending",
              last_submission: delivery.deliveryDate,
            })
          }
          
          const payout = payoutMap.get(staffId)!
          payout.deliveries++
          
          if (delivery.dataSource !== 'not_found') {
            payout.paid++
          }
          
          if (delivery.correctionStatus !== 'None') {
            payout.corrected++
          }
          
          payout.payout = payout.paid * payout.rate_per_form
          
          // Update last submission if this delivery is more recent
          if (new Date(delivery.deliveryDate) > new Date(payout.last_submission)) {
            payout.last_submission = delivery.deliveryDate
          }
        })

        setPayouts(Array.from(payoutMap.values()))
        setError(false)
      } catch (err) {
        setError(true)
        toast({
          title: "Error",
          description: "Failed to load payout data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [toast])

  // Apply filters
  useEffect(() => {
    let filtered = [...payouts]

    // Staff search
    if (filters.staffSearch) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(filters.staffSearch.toLowerCase()) || p.mobile.includes(filters.staffSearch),
      )
    }

    // Zone filter
    if (filters.zone) {
      filtered = filtered.filter((p) => p.zone === filters.zone)
    }

    // Ward filter
    if (filters.ward) {
      filtered = filtered.filter((p) => p.ward === filters.ward)
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((p) => p.status === filters.status)
    }

    // Exclude corrected
    if (filters.excludeCorrected) {
      filtered = filtered.filter((p) => p.corrected === 0)
    }

    // Only paid
    if (filters.onlyPaid) {
      filtered = filtered.filter((p) => p.status === "Paid")
    }

    // Sort by total payout descending
    filtered.sort((a, b) => b.payout - a.payout)

    setFilteredPayouts(filtered)
  }, [payouts, filters])

  const handleExport = async () => {
    toast({
      title: "Exporting data...",
      description: "Preparing Excel file with filtered payout data",
    })

    // Simulate export
    setTimeout(() => {
      toast({
        title: "Export completed!",
        description: `Exported ${filteredPayouts.length} payout records to Excel`,
      })
    }, 2000)
  }

  const handleBulkStatusUpdate = (newStatus: "Approved" | "Paid") => {
    if (selectedRows.length === 0) return

    setPayouts((prev) =>
      prev.map((payout) => (selectedRows.includes(payout.id) ? { ...payout, status: newStatus } : payout)),
    )

    toast({
      title: "Status updated!",
      description: `Marked ${selectedRows.length} staff as ${newStatus}`,
    })

    setSelectedRows([])
  }

  const handleRateEdit = (id: string, newRate: number) => {
    setPayouts((prev) =>
      prev.map((payout) =>
        payout.id === id
          ? {
              ...payout,
              rate_per_form: newRate,
              payout: payout.paid * newRate,
            }
          : payout,
      ),
    )

    toast({
      title: "Rate updated!",
      description: `Updated rate to ₹${newRate} per form`,
    })
  }

  const handleGlobalRateUpdate = () => {
    setPayouts((prev) =>
      prev.map((payout) => ({
        ...payout,
        rate_per_form: globalRate,
        payout: payout.paid * globalRate,
      })),
    )

    toast({
      title: "Global rate applied!",
      description: `Updated all staff to ₹${globalRate} per form`,
    })
  }

  const handlePaymentAdjustment = () => {
    if (!selectedStaff) return

    const adjustment = Number.parseFloat(manualPayout) || selectedStaff.payout

    setPayouts((prev) =>
      prev.map((payout) =>
        payout.id === selectedStaff.id
          ? {
              ...payout,
              payout: adjustment,
              remarks: paymentNote,
            }
          : payout,
      ),
    )

    toast({
      title: "Payment adjusted!",
      description: `Updated payout for ${selectedStaff.name}`,
    })

    setAdjustmentDrawerOpen(false)
    setPaymentNote("")
    setManualPayout("")
    setSelectedStaff(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      case "Approved":
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        )
      case "Paid":
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700 gap-1">
            <DollarSign className="h-3 w-3" />
            Paid
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const resetFilters = () => {
    setFilters({
      dateRange: "all",
      staffSearch: "",
      zone: "",
      ward: "",
      status: "",
      excludeCorrected: false,
      onlyPaid: false,
    })
    toast({
      title: "Filters reset",
      description: "All filters have been cleared",
    })
  }

  const retryLoad = () => {
    setError(false)
    setLoading(true)
    setTimeout(() => {
      setPayouts(mockPayouts)
      setLoading(false)
    }, 1000)
  }

  if (error) {
    return (
      <AuthGuard allowedRoles={["admin"]}>
        <AdminLayout>
          <div className="p-4">
            <Alert className="max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                Failed to load payout data
                <Button onClick={retryLoad} size="sm" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </AdminLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="p-4 space-y-4">
          {/* Section 1: Title + Export Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Staff Payout Report</h1>
              <p className="text-sm text-muted-foreground">
                Manage staff earnings and payout status based on delivery submissions
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleExport} className="gap-2">
                    <Download className="h-4 w-4" />
                    Export to Excel
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export filtered payout data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Section 2: Filters + Global Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Date Range */}
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, dateRange: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Staff Search */}
                <div className="space-y-2">
                  <Label>Staff Name / Mobile</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search staff..."
                      value={filters.staffSearch}
                      onChange={(e) => setFilters((prev) => ({ ...prev, staffSearch: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Zone */}
                <div className="space-y-2">
                  <Label>Zone</Label>
                  <Select
                    value={filters.zone || "all"} // Updated default value to "all"
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, zone: value, ward: "" }))}
                  >
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

                {/* Ward */}
                <div className="space-y-2">
                  <Label>Ward</Label>
                  <Select
                    value={filters.ward || "all"} // Updated default value to "all"
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, ward: value }))}
                    disabled={!filters.zone}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Wards</SelectItem>
                      {filters.zone &&
                        wards[filters.zone as keyof typeof wards]?.map((ward) => (
                          <SelectItem key={ward} value={ward}>
                            {ward}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label>Payout Status</Label>
                  <Select
                    value={filters.status || "all"} // Updated default value to "all"
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Global Rate */}
                <div className="space-y-2">
                  <Label>Global Rate Per Form (₹)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={globalRate}
                      onChange={(e) => setGlobalRate(Number(e.target.value))}
                      min="1"
                      max="100"
                    />
                    <Button onClick={handleGlobalRateUpdate} size="sm" variant="outline">
                      Apply
                    </Button>
                  </div>
                </div>
              </div>

              {/* Toggle Options */}
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="excludeCorrected"
                    checked={filters.excludeCorrected}
                    onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, excludeCorrected: !!checked }))}
                  />
                  <Label htmlFor="excludeCorrected" className="text-sm">
                    Exclude corrected forms
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="onlyPaid"
                    checked={filters.onlyPaid}
                    onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, onlyPaid: !!checked }))}
                  />
                  <Label htmlFor="onlyPaid" className="text-sm">
                    Only include Paid = Yes
                  </Label>
                </div>
                <Button onClick={resetFilters} variant="outline" size="sm">
                  Reset Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Payout Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payout Summary ({filteredPayouts.length} staff)</CardTitle>
                {selectedRows.length > 0 && (
                  <div className="flex gap-2">
                    <Button onClick={() => handleBulkStatusUpdate("Approved")} size="sm" variant="outline">
                      Mark as Approved ({selectedRows.length})
                    </Button>
                    <Button
                      onClick={() => handleBulkStatusUpdate("Paid")}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Mark as Paid ({selectedRows.length})
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              ) : filteredPayouts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No payout data found</h3>
                  <p className="text-muted-foreground">
                    No payout data matches your current filters. Try adjusting your search criteria.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedRows.length === filteredPayouts.length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRows(filteredPayouts.map((p) => p.id))
                              } else {
                                setSelectedRows([])
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Staff Name</TableHead>
                        <TableHead>Mobile</TableHead>
                        <TableHead>Zone → Ward</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Corrected</TableHead>
                        <TableHead className="text-right">₹ per Form</TableHead>
                        <TableHead className="text-right font-semibold">Total Payout (₹)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Submission</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayouts.map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedRows.includes(payout.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedRows((prev) => [...prev, payout.id])
                                } else {
                                  setSelectedRows((prev) => prev.filter((id) => id !== payout.id))
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{payout.name}</TableCell>
                          <TableCell className="text-muted-foreground">{payout.mobile}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{payout.zone}</div>
                              <div className="text-muted-foreground">→ {payout.ward}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{payout.deliveries}</TableCell>
                          <TableCell className="text-right">{payout.paid}</TableCell>
                          <TableCell className="text-right">
                            {payout.corrected > 0 ? (
                              <Badge variant="destructive" className="text-xs">
                                {payout.corrected}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editingRate === payout.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  value={tempRate}
                                  onChange={(e) => setTempRate(e.target.value)}
                                  className="w-16 h-8 text-xs"
                                  min="1"
                                  max="100"
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    handleRateEdit(payout.id, Number(tempRate))
                                    setEditingRate(null)
                                    setTempRate("")
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingRate(null)
                                    setTempRate("")
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span>₹{payout.rate_per_form}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingRate(payout.id)
                                    setTempRate(payout.rate_per_form.toString())
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-700">
                            ₹{payout.payout.toLocaleString()}
                          </TableCell>
                          <TableCell>{getStatusBadge(payout.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(payout.last_submission)}
                          </TableCell>
                          <TableCell>
                            <Drawer
                              open={adjustmentDrawerOpen && selectedStaff?.id === payout.id}
                              onOpenChange={(open) => {
                                setAdjustmentDrawerOpen(open)
                                if (open) {
                                  setSelectedStaff(payout)
                                  setManualPayout(payout.payout.toString())
                                } else {
                                  setSelectedStaff(null)
                                  setPaymentNote("")
                                  setManualPayout("")
                                }
                              }}
                            >
                              <DrawerTrigger asChild>
                                <Button size="sm" variant="outline" className="gap-1 bg-transparent">
                                  <FileText className="h-3 w-3" />
                                  Adjust
                                </Button>
                              </DrawerTrigger>
                              <DrawerContent>
                                <DrawerHeader>
                                  <DrawerTitle>Payment Adjustments - {payout.name}</DrawerTitle>
                                </DrawerHeader>
                                <div className="p-4 space-y-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Current Payout:</span>
                                      <div className="font-semibold">₹{payout.payout}</div>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Deliveries:</span>
                                      <div>
                                        {payout.paid} paid / {payout.deliveries} total
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Manual Payout Override (₹)</Label>
                                    <Input
                                      type="number"
                                      value={manualPayout}
                                      onChange={(e) => setManualPayout(e.target.value)}
                                      placeholder="Enter custom amount"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Payment Note/Remark</Label>
                                    <Textarea
                                      value={paymentNote}
                                      onChange={(e) => setPaymentNote(e.target.value)}
                                      placeholder="Add any notes or remarks for this payment adjustment..."
                                      rows={3}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Proof of Payment (Optional)</Label>
                                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                      <p className="text-sm text-muted-foreground">
                                        Click to upload payment receipt or proof
                                      </p>
                                      <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                                        Choose File
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="flex gap-2 pt-4">
                                    <Button onClick={handlePaymentAdjustment} className="flex-1">
                                      Save Adjustment
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => setAdjustmentDrawerOpen(false)}
                                      className="flex-1"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </DrawerContent>
                            </Drawer>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Staff</p>
                    <p className="text-2xl font-bold">{filteredPayouts.length}</p>
                  </div>
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Payout</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{filteredPayouts.reduce((sum, p) => sum + p.payout, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Payments</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {filteredPayouts.filter((p) => p.status === "Pending").length}
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Paid Staff</p>
                    <p className="text-2xl font-bold text-green-600">
                      {filteredPayouts.filter((p) => p.status === "Paid").length}
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
