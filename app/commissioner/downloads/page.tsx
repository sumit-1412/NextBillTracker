"use client"

import { useState, useMemo, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import CommissionerLayout from "@/components/commissioner-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import {
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { apiService } from "@/lib/api"

// Mock data for zones and wards
const mockZones = ["Zone A", "Zone B", "Zone C", "Zone D", "Zone E"]
const mockWards = {
  "Zone A": ["Ward 1", "Ward 2", "Ward 3"],
  "Zone B": ["Ward 4", "Ward 5", "Ward 6", "Ward 7"],
  "Zone C": ["Ward 8", "Ward 9"],
  "Zone D": ["Ward 10", "Ward 11", "Ward 12", "Ward 13"],
  "Zone E": ["Ward 14", "Ward 15"],
}

// Mock download history data
const mockDownloadHistory = [
  {
    id: 1,
    reportType: "Delivery Summary Report",
    requestedBy: "Commissioner",
    timeRequested: "2024-01-15 10:30 AM",
    timeCompleted: "2024-01-15 10:32 AM",
    status: "ready",
    fileName: "Delivery_Summary_Jan_2024.xlsx",
    fileSize: "2.4 MB",
  },
  {
    id: 2,
    reportType: "Staff Performance Report",
    requestedBy: "Commissioner",
    timeRequested: "2024-01-15 09:15 AM",
    timeCompleted: null,
    status: "pending",
    fileName: null,
    fileSize: null,
  },
  {
    id: 3,
    reportType: "Photo Metadata Report",
    requestedBy: "Commissioner",
    timeRequested: "2024-01-14 04:45 PM",
    timeCompleted: "2024-01-14 04:47 PM",
    status: "ready",
    fileName: "Photo_Metadata_Jan_2024.xlsx",
    fileSize: "5.8 MB",
  },
  {
    id: 4,
    reportType: "Raw Deliveries Log",
    requestedBy: "Commissioner",
    timeRequested: "2024-01-14 02:20 PM",
    timeCompleted: null,
    status: "failed",
    fileName: null,
    fileSize: null,
  },
  {
    id: 5,
    reportType: "Correction Log Report",
    requestedBy: "Commissioner",
    timeRequested: "2024-01-13 11:30 AM",
    timeCompleted: "2024-01-13 11:35 AM",
    status: "ready",
    fileName: "Correction_Log_Jan_2024.xlsx",
    fileSize: "1.2 MB",
  },
]

const reportTypes = [
  {
    value: "delivery-summary",
    label: "Delivery Summary Report",
    description: "Aggregated delivery statistics by zone and ward",
  },
  {
    value: "raw-deliveries",
    label: "Raw Deliveries Log",
    description: "Complete delivery records with all details",
  },
  {
    value: "correction-log",
    label: "Correction Log Report",
    description: "Records of all corrections made to deliveries",
  },
  {
    value: "staff-performance",
    label: "Staff-wise Performance Report",
    description: "Individual staff performance metrics and statistics",
  },
  {
    value: "photo-metadata",
    label: "Photo Metadata Report",
    description: "Photo submission details with GPS and quality data",
  },
]

const datePresets = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "Custom Range", value: "custom" },
]

export default function CommissionerDownloads() {
  // State management
  const [reportType, setReportType] = useState("")
  const [dateRange, setDateRange] = useState("")
  const [selectedZone, setSelectedZone] = useState("")
  const [selectedWard, setSelectedWard] = useState("")
  const [staffName, setStaffName] = useState("")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [downloadHistory, setDownloadHistory] = useState(mockDownloadHistory)
  const [currentPage, setCurrentPage] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [zoneData, setZoneData] = useState<any[]>([])
  const [wardData, setWardData] = useState<any[]>([])

  const itemsPerPage = 5

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [propertiesResponse, deliveriesResponse] = await Promise.all([
          apiService.getProperties(),
          apiService.getDeliveries(),
        ])

        const properties = propertiesResponse.properties
        const deliveries = deliveriesResponse.deliveries
        
        // Mock users data since getUsers doesn't exist
        const users = [
          { _id: "1", email: "staff1@example.com", fullName: "Staff One", role: "staff", isActive: true },
          { _id: "2", email: "staff2@example.com", fullName: "Staff Two", role: "staff", isActive: true },
        ]

        // Calculate zone data
        const zoneMap = new Map<string, any>()
        
        properties.forEach(property => {
          const zoneName = property.ward.corporateName
          if (!zoneMap.has(zoneName)) {
            zoneMap.set(zoneName, {
              id: zoneName,
              zoneName: zoneName,
              totalProperties: 0,
              deliveredProperties: 0,
              pendingProperties: 0,
              paidDeliveries: 0,
              unpaidDeliveries: 0,
              staffCount: 0,
              lastActivity: "",
            })
          }
          zoneMap.get(zoneName)!.totalProperties++
        })

        // Calculate delivery stats
        deliveries.forEach(delivery => {
          const zoneName = delivery.property.ward.corporateName
          if (zoneMap.has(zoneName)) {
            const zone = zoneMap.get(zoneName)!
            zone.deliveredProperties++
            if (delivery.dataSource !== 'not_found') {
              zone.paidDeliveries++
            } else {
              zone.unpaidDeliveries++
            }
            
            if (!zone.lastActivity || new Date(delivery.deliveryDate) > new Date(zone.lastActivity)) {
              zone.lastActivity = delivery.deliveryDate
            }
          }
        })

        // Calculate pending properties
        zoneMap.forEach(zone => {
          zone.pendingProperties = zone.totalProperties - zone.deliveredProperties
        })

        // Calculate staff count
        users.forEach((user: any) => {
          if (user.role === 'staff') {
            const userDeliveries = deliveries.filter((d: any) => d.staff._id === user._id)
            if (userDeliveries.length > 0) {
              const zoneName = userDeliveries[0].property.ward.corporateName
              if (zoneMap.has(zoneName)) {
                zoneMap.get(zoneName)!.staffCount++
              }
            }
          }
        })

        setZoneData(Array.from(zoneMap.values()))

        // Calculate ward data
        const wardMap = new Map<string, any>()
        properties.forEach(property => {
          const wardKey = `${property.ward.corporateName}-${property.ward.wardName}`
          if (!wardMap.has(wardKey)) {
            wardMap.set(wardKey, {
              id: wardKey,
              zoneName: property.ward.corporateName,
              wardName: property.ward.wardName,
              totalProperties: 0,
              deliveredProperties: 0,
              pendingProperties: 0,
              paidDeliveries: 0,
              unpaidDeliveries: 0,
              staffCount: 0,
              lastActivity: "",
            })
          }
          wardMap.get(wardKey)!.totalProperties++
        })

        // Calculate ward delivery stats
        deliveries.forEach(delivery => {
          const wardKey = `${delivery.property.ward.corporateName}-${delivery.property.ward.wardName}`
          if (wardMap.has(wardKey)) {
            const ward = wardMap.get(wardKey)!
            ward.deliveredProperties++
            if (delivery.dataSource !== 'not_found') {
              ward.paidDeliveries++
            } else {
              ward.unpaidDeliveries++
            }
            
            if (!ward.lastActivity || new Date(delivery.deliveryDate) > new Date(ward.lastActivity)) {
              ward.lastActivity = delivery.deliveryDate
            }
          }
        })

        // Calculate pending properties for wards
        wardMap.forEach(ward => {
          ward.pendingProperties = ward.totalProperties - ward.deliveredProperties
        })

        setWardData(Array.from(wardMap.values()))

        setLoading(false)
      } catch (error) {
        console.error('Error loading data:', error)
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  // Get available wards based on selected zone
  const availableWards = useMemo(() => {
    if (!selectedZone || selectedZone === "") return []
    return (mockWards as Record<string, string[]>)[selectedZone] || []
  }, [selectedZone])

  // Handle zone change
  const handleZoneChange = (value: string) => {
    setSelectedZone(value === "__all__" ? "" : value)
    setSelectedWard("")
  }

  // Generate file name
  const generateFileName = useMemo(() => {
    if (!reportType || !dateRange) return ""

    const reportLabel = reportTypes.find((r) => r.value === reportType)?.label || "Report"
    const cleanName = reportLabel.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "")
    const dateStr =
      dateRange === "custom"
        ? "Custom_Range"
        : dateRange === "today"
          ? "Today"
          : dateRange === "week"
            ? "This_Week"
            : dateRange === "month"
              ? "This_Month"
              : "Report"

    return `${cleanName}_${dateStr}.xlsx`
  }, [reportType, dateRange])

  // Validate form
  const isFormValid = reportType && dateRange && (dateRange !== "custom" || (customStartDate && customEndDate))

  // Handle export
  const handleExport = async (format = "xlsx") => {
    if (!isFormValid) {
      toast({
        title: "Validation Error",
        description: "Please select a report type and date range",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Add to download history
      const newDownload = {
        id: downloadHistory.length + 1,
        reportType: reportTypes.find((r) => r.value === reportType)?.label || reportType,
        requestedBy: "Commissioner",
        timeRequested: new Date().toLocaleString(),
        timeCompleted: null,
        status: "pending",
        fileName: null,
        fileSize: null,
      }

      setDownloadHistory((prev) => [newDownload, ...prev])

      toast({
        title: "Export Started",
        description: `${format.toUpperCase()} report generation has been queued`,
      })

      // Simulate completion after 3 seconds
      setTimeout(() => {
        setDownloadHistory((prev) =>
          prev.map((item) =>
            item.id === newDownload.id
              ? {
                  ...item,
                  status: "ready",
                  timeCompleted: new Date().toLocaleString(),
                  fileName: generateFileName.replace(".xlsx", `.${format}`),
                  fileSize: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
                }
              : item,
          ),
        )

        toast({
          title: "Report Ready",
          description: "Your report has been generated and is ready for download",
        })
      }, 3000)
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error generating your report",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle download
  const handleDownload = (fileName: string, fileSize: string) => {
    toast({
      title: "Download Started",
      description: `Downloading ${fileName} (${fileSize})`,
    })
    console.log("Downloading:", fileName)
  }

  // Handle retry
  const handleRetry = (id: number) => {
    setDownloadHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "pending", timeCompleted: null, fileName: null, fileSize: null } : item)),
    )

    toast({
      title: "Retry Started",
      description: "Report generation has been requeued",
    })

    // Simulate retry completion
    setTimeout(() => {
      setDownloadHistory((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "ready",
                timeCompleted: new Date().toLocaleString(),
                fileName: `Retried_Report_${Date.now()}.xlsx`,
                fileSize: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
              }
            : item,
        ),
      )
    }, 2000)
  }

  // Handle refresh history
  const handleRefreshHistory = async () => {
    setIsRefreshing(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsRefreshing(false)
    toast({
      title: "History Refreshed",
      description: "Download history has been updated",
    })
  }

  // Pagination
  const totalPages = Math.ceil(downloadHistory.length / itemsPerPage)
  const paginatedHistory = downloadHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "ready":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <AuthGuard allowedRoles={["commissioner"]}>
      <CommissionerLayout>
        <div className="flex-1 space-y-6 p-4 md:p-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Export Reports</h1>
              <p className="text-muted-foreground">Generate and download comprehensive delivery reports</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Report Configuration */}
            <div className="lg:col-span-2 space-y-6">
              {/* Section 1: Report Type Selector */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Report Type</CardTitle>
                  <CardDescription>Choose the type of report you want to generate</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="reportType">Report Type *</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a report type" />
                      </SelectTrigger>
                      <SelectContent>
                        {reportTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-muted-foreground">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Section 2: Filter Controls */}
              <Card>
                <CardHeader>
                  <CardTitle>Filter Options</CardTitle>
                  <CardDescription>Configure the data range and filters for your report</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="dateRange">Date Range *</Label>
                      <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select date range" />
                        </SelectTrigger>
                        <SelectContent>
                          {datePresets.map((preset) => (
                            <SelectItem key={preset.value} value={preset.value}>
                              {preset.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="zone">Zone</Label>
                      <Select value={selectedZone || "__all__"} onValueChange={handleZoneChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Zones" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All Zones</SelectItem>
                          {mockZones.map((zone) => (
                            <SelectItem key={zone} value={zone}>
                              {zone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="ward">Ward</Label>
                      <Select
                        value={selectedWard || "__all__"}
                        onValueChange={(value) => setSelectedWard(value === "__all__" ? "" : value)}
                        disabled={!selectedZone}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Wards" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All Wards</SelectItem>
                          {availableWards.map((ward) => (
                            <SelectItem key={ward} value={ward}>
                              {ward}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="staffName">Staff Name (Optional)</Label>
                      <Input
                        id="staffName"
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        placeholder="Enter staff name"
                      />
                    </div>
                  </div>

                  {/* Custom Date Range */}
                  {dateRange === "custom" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="startDate">Start Date *</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate">End Date *</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Section 3: Export Buttons */}
              <Card>
                <CardHeader>
                  <CardTitle>Generate Report</CardTitle>
                  <CardDescription>{generateFileName && `File will be saved as: ${generateFileName}`}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => handleExport("xlsx")}
                      disabled={!isFormValid || isLoading}
                      className="flex items-center gap-2"
                    >
                      {isLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="h-4 w-4" />
                      )}
                      {isLoading ? "Generating..." : "Export as Excel (.xlsx)"}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleExport("csv")}
                      disabled={!isFormValid || isLoading}
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Export as CSV (.csv)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Download History */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Download History</CardTitle>
                      <CardDescription>Track your report generation and download status</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshHistory}
                      disabled={isRefreshing}
                      className="flex items-center gap-2 bg-transparent"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <h3 className="text-lg font-medium text-foreground mb-2">Loading Data...</h3>
                      <p className="text-muted-foreground">Please wait while we fetch the latest data.</p>
                    </div>
                  ) : downloadHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No Reports Yet</h3>
                      <p className="text-muted-foreground">
                        Reports you generate will appear here with download links.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Report Type</TableHead>
                              <TableHead>Requested</TableHead>
                              <TableHead>Completed</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedHistory.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.reportType}</TableCell>
                                <TableCell>{item.timeRequested}</TableCell>
                                <TableCell>{item.timeCompleted || "-"}</TableCell>
                                <TableCell>{getStatusBadge(item.status)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {item.status === "ready" && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleDownload(item.fileName as string, item.fileSize as string)}
                                        className="flex items-center gap-1"
                                      >
                                        <Download className="h-3 w-3" />
                                        Download
                                      </Button>
                                    )}
                                    {item.status === "failed" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRetry(item.id)}
                                        className="flex items-center gap-1"
                                      >
                                        <RefreshCw className="h-3 w-3" />
                                        Retry
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          <p className="text-sm text-muted-foreground">
                            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                            {Math.min(currentPage * itemsPerPage, downloadHistory.length)} of {downloadHistory.length}{" "}
                            entries
                          </p>
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
            </div>
          </div>
        </div>
      </CommissionerLayout>
    </AuthGuard>
  )
}
