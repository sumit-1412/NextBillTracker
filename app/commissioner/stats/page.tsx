"use client"

import { useState, useMemo, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import CommissionerLayout from "@/components/commissioner-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  Filter,
  BarChart3,
  TrendingUp,
  MapPin,
  Users,
  FileText,
  RefreshCw,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { apiService } from "@/lib/api"

// Types for API data
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

interface User {
  _id: string
  email: string
  fullName: string
  staffId?: string
  role: 'staff' | 'admin' | 'commissioner'
  isActive: boolean
  mobileNo?: string
}

export default function CommissionerStats() {
  const [dateRange, setDateRange] = useState("week")
  const [selectedZone, setSelectedZone] = useState("all")
  const [selectedWard, setSelectedWard] = useState("all")
  const [paidOnly, setPaidOnly] = useState(false)
  const [expandedZones, setExpandedZones] = useState<number[]>([])
  const [sortField, setSortField] = useState<string>("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [loading, setLoading] = useState(false)
  const [zoneData, setZoneData] = useState<any[]>([])
  const [dailyTrends, setDailyTrends] = useState<any[]>([])

  // Load data from API
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        const [propertiesResponse, deliveriesResponse] = await Promise.all([
          apiService.getProperties(),
          apiService.getDeliveries(),
        ])

        const properties: Property[] = propertiesResponse.properties
        const deliveries: Delivery[] = deliveriesResponse.deliveries

        // Mock users data since getUsers doesn't exist
        const users: User[] = [
          { _id: "1", email: "staff1@example.com", fullName: "Staff One", role: "staff", isActive: true },
          { _id: "2", email: "staff2@example.com", fullName: "Staff Two", role: "staff", isActive: true },
        ]

        // Calculate zone data from properties and deliveries
        const zoneMap = new Map<string, any>()
        
        // Initialize zones from properties
        properties.forEach((property: Property) => {
          const zoneName = property.ward.corporateName
          if (!zoneMap.has(zoneName)) {
            zoneMap.set(zoneName, {
              id: zoneName,
              zoneName: zoneName,
              totalProperties: 0,
              deliveriesCompleted: 0,
              paidDeliveries: 0,
              staffCount: 0,
              lastDeliveryDate: "",
              wards: [],
            })
          }
          zoneMap.get(zoneName)!.totalProperties++
        })

        // Calculate delivery stats
        deliveries.forEach((delivery: Delivery) => {
          const zoneName = delivery.property.ward.corporateName
          if (zoneMap.has(zoneName)) {
            const zone = zoneMap.get(zoneName)!
            zone.deliveriesCompleted++
            if (delivery.dataSource !== 'not_found') {
              zone.paidDeliveries++
            }
            
            // Update last delivery date
            if (!zone.lastDeliveryDate || new Date(delivery.deliveryDate) > new Date(zone.lastDeliveryDate)) {
              zone.lastDeliveryDate = delivery.deliveryDate
            }
          }
        })

        // Calculate staff count per zone
        users.forEach((user: User) => {
          if (user.role === 'staff') {
            // For now, assign staff to zones based on their deliveries
            const userDeliveries = deliveries.filter((d: Delivery) => d.staff._id === user._id)
            if (userDeliveries.length > 0) {
              const zoneName = userDeliveries[0].property.ward.corporateName
              if (zoneMap.has(zoneName)) {
                zoneMap.get(zoneName)!.staffCount++
              }
            }
          }
        })

        // Calculate ward data for each zone
        zoneMap.forEach(zone => {
          const zoneProperties = properties.filter((p: Property) => p.ward.corporateName === zone.zoneName)
          const zoneDeliveries = deliveries.filter((d: Delivery) => d.property.ward.corporateName === zone.zoneName)
          
          // Group by ward
          const wardMap = new Map<string, any>()
          zoneProperties.forEach((property: Property) => {
            const wardName = property.ward.wardName
            if (!wardMap.has(wardName)) {
              wardMap.set(wardName, {
                id: wardName,
                wardName: wardName,
                totalProperties: 0,
                deliveriesCompleted: 0,
                paidDeliveries: 0,
                staffCount: 0,
                lastDeliveryDate: "",
              })
            }
            wardMap.get(wardName)!.totalProperties++
          })

          // Calculate ward delivery stats
          zoneDeliveries.forEach((delivery: Delivery) => {
            const wardName = delivery.property.ward.wardName
            if (wardMap.has(wardName)) {
              const ward = wardMap.get(wardName)!
              ward.deliveriesCompleted++
              if (delivery.dataSource !== 'not_found') {
                ward.paidDeliveries++
              }
              
              if (!ward.lastDeliveryDate || new Date(delivery.deliveryDate) > new Date(ward.lastDeliveryDate)) {
                ward.lastDeliveryDate = delivery.deliveryDate
              }
            }
          })

          zone.wards = Array.from(wardMap.values())
        })

        setZoneData(Array.from(zoneMap.values()))

        // Calculate daily trends (last 14 days)
        const dailyTrends = []
        const now = new Date()
        for (let i = 13; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const dateStr = date.toISOString().split('T')[0]
          
          const dayDeliveries = deliveries.filter((d: Delivery) => {
            const deliveryDate = new Date(d.deliveryDate)
            return deliveryDate.toISOString().split('T')[0] === dateStr
          })

          const zoneStats: Record<string, number> = {}
          zoneMap.forEach((zone, zoneName) => {
            const zoneDeliveries = dayDeliveries.filter((d: Delivery) => d.property.ward.corporateName === zoneName)
            zoneStats[`zone${zoneName.replace(/\s+/g, '')}`] = zoneDeliveries.length
          })

          dailyTrends.push({
            date: dateStr,
            ...zoneStats
          })
        }

        setDailyTrends(dailyTrends)
        setLoading(false)
      } catch (error) {
        console.error('Error loading stats:', error)
        toast({
          title: "Error",
          description: "Failed to load statistics. Please try again.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    loadStats()
  }, [toast])

  // Calculate completion percentage
  const calculateCompletion = (completed: number, total: number) => {
    return total > 0 ? (completed / total) * 100 : 0
  }

  // Calculate average deliveries per staff
  const calculateAvgPerStaff = (deliveries: number, staff: number) => {
    return staff > 0 ? deliveries / staff : 0
  }

  // Get completion color class
  const getCompletionColor = (rate: number) => {
    if (rate >= 90) return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300"
    if (rate >= 50) return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300"
    return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300"
  }

  // Get completion badge color
  const getCompletionBadgeColor = (rate: number) => {
    if (rate >= 90) return "bg-green-500"
    if (rate >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  // Filter and sort zone data
  const filteredZoneData = useMemo(() => {
    let filtered = [...zoneData]

    // Filter by zone
    if (selectedZone !== "all") {
      filtered = filtered.filter((zone) => zone.zoneName === selectedZone)
    }

    // Filter by ward (if zone is selected)
    if (selectedWard !== "all" && selectedZone !== "all") {
      filtered = filtered.map((zone) => ({
        ...zone,
        wards: zone.wards.filter((ward: any) => ward.wardName === selectedWard),
      }))
    }

    // Apply paid only filter
    if (paidOnly) {
      filtered = filtered.filter((zone) => {
        const paidRate = (zone.paidDeliveries / zone.deliveriesCompleted) * 100
        return paidRate > 80 // Only show zones with >80% paid rate
      })
    }

    // Sort data
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: any
        let bValue: any

        switch (sortField) {
          case "zoneName":
            aValue = a.zoneName.toLowerCase()
            bValue = b.zoneName.toLowerCase()
            break
          case "completion":
            aValue = calculateCompletion(a.deliveriesCompleted, a.totalProperties)
            bValue = calculateCompletion(b.deliveriesCompleted, b.totalProperties)
            break
          case "deliveries":
            aValue = a.deliveriesCompleted
            bValue = b.deliveriesCompleted
            break
          case "avgPerStaff":
            aValue = calculateAvgPerStaff(a.deliveriesCompleted, a.staffCount)
            bValue = calculateAvgPerStaff(b.deliveriesCompleted, b.staffCount)
            break
          default:
            return 0
        }

        if (sortOrder === "asc") {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
      })
    }

    return filtered
  }, [selectedZone, selectedWard, paidOnly, sortField, sortOrder, zoneData])

  // Get available wards for selected zone
  const availableWards = useMemo(() => {
    if (selectedZone === "all") return []
    const zone = zoneData.find((z) => z.zoneName === selectedZone)
    return zone?.wards || []
  }, [selectedZone, zoneData])

  // Chart data for deliveries per ward
  const wardDeliveryData = useMemo(() => {
    const allWards = filteredZoneData.flatMap((zone) => zone.wards)
    return allWards.map((ward) => ({
      wardName: ward.wardName,
      deliveries: ward.deliveriesCompleted,
      completion: calculateCompletion(ward.deliveriesCompleted, ward.totalProperties),
    }))
  }, [filteredZoneData])

  const toggleZoneExpansion = (zoneId: number) => {
    setExpandedZones((prev) => (prev.includes(zoneId) ? prev.filter((id) => id !== zoneId) : [...prev, zoneId]))
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const applyFilters = () => {
    setLoading(true)
    toast({
      title: "Filters Applied",
      description: "Statistics have been updated based on your filters.",
    })

    // Simulate loading
    setTimeout(() => {
      setLoading(false)
    }, 1000)

    console.log("Applied filters:", { dateRange, selectedZone, selectedWard, paidOnly })
  }

  const clearFilters = () => {
    setDateRange("week")
    setSelectedZone("all")
    setSelectedWard("all")
    setPaidOnly(false)
    setSortField("")
    setSortOrder("asc")
    toast({
      title: "Filters Cleared",
      description: "All filters have been reset to default values.",
    })
  }

  const exportStats = () => {
    toast({
      title: "Export Started",
      description: "Zone and ward statistics are being exported to CSV...",
    })
    console.log("Exporting stats:", {
      filteredZoneData,
      wardDeliveryData,
      filters: { dateRange, selectedZone, selectedWard, paidOnly },
    })
  }

  const refreshData = () => {
    setLoading(true)
    toast({
      title: "Data Refreshed",
      description: "Statistics have been updated with the latest data.",
    })

    setTimeout(() => {
      setLoading(false)
    }, 1500)
  }

  if (loading) {
    return (
      <AuthGuard allowedRoles={["commissioner"]}>
        <CommissionerLayout>
          <div className="p-4 space-y-6 bg-background">
            <div className="flex justify-between items-center">
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </CommissionerLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={["commissioner"]}>
      <CommissionerLayout>
        <div className="p-4 space-y-6 bg-background">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Zone & Ward Stats</h1>
              <p className="text-muted-foreground">Detailed performance analytics by zone and ward</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={refreshData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportStats} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Stats
              </Button>
            </div>
          </div>

          {/* Filter Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
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
                      {zoneData.map((zone) => (
                        <SelectItem key={zone.id} value={zone.zoneName}>
                          {zone.zoneName}
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
                      {availableWards.map((ward: any) => (
                        <SelectItem key={ward.id} value={ward.wardName}>
                          {ward.wardName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Paid Only</label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch id="paid-only" checked={paidOnly} onCheckedChange={setPaidOnly} />
                    <label htmlFor="paid-only" className="text-sm">
                      High payment rate zones
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={applyFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Zone-Level Summary Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Zone Performance Summary</CardTitle>
                  <CardDescription>Click on zones to expand ward-level details</CardDescription>
                </div>
                <Button onClick={exportStats} variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredZoneData.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Data Found</h3>
                  <p className="text-muted-foreground">Try changing the filters or date range.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("zoneName")}>
                          Zone Name
                          {sortField === "zoneName" &&
                            (sortOrder === "asc" ? (
                              <ChevronUp className="inline h-4 w-4 ml-1" />
                            ) : (
                              <ChevronDown className="inline h-4 w-4 ml-1" />
                            ))}
                        </TableHead>
                        <TableHead>Total Properties</TableHead>
                        <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("deliveries")}>
                          Deliveries Completed
                          {sortField === "deliveries" &&
                            (sortOrder === "asc" ? (
                              <ChevronUp className="inline h-4 w-4 ml-1" />
                            ) : (
                              <ChevronDown className="inline h-4 w-4 ml-1" />
                            ))}
                        </TableHead>
                        <TableHead>Paid Deliveries</TableHead>
                        <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("completion")}>
                          Completion %
                          {sortField === "completion" &&
                            (sortOrder === "asc" ? (
                              <ChevronUp className="inline h-4 w-4 ml-1" />
                            ) : (
                              <ChevronDown className="inline h-4 w-4 ml-1" />
                            ))}
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("avgPerStaff")}>
                          Avg. per Staff
                          {sortField === "avgPerStaff" &&
                            (sortOrder === "asc" ? (
                              <ChevronUp className="inline h-4 w-4 ml-1" />
                            ) : (
                              <ChevronDown className="inline h-4 w-4 ml-1" />
                            ))}
                        </TableHead>
                        <TableHead>Last Delivery</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredZoneData.map((zone) => {
                        const completionRate = calculateCompletion(zone.deliveriesCompleted, zone.totalProperties)
                        const avgPerStaff = calculateAvgPerStaff(zone.deliveriesCompleted, zone.staffCount)

                        return (
                          <>
                            <TableRow
                              key={zone.id}
                              className={cn(
                                "cursor-pointer hover:bg-accent transition-colors",
                                getCompletionColor(completionRate),
                              )}
                              onClick={() => toggleZoneExpansion(zone.id)}
                            >
                              <TableCell>
                                {expandedZones.includes(zone.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </TableCell>
                              <TableCell className="font-medium">{zone.zoneName}</TableCell>
                              <TableCell>{zone.totalProperties.toLocaleString()}</TableCell>
                              <TableCell>{zone.deliveriesCompleted.toLocaleString()}</TableCell>
                              <TableCell>{zone.paidDeliveries.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge className={`${getCompletionBadgeColor(completionRate)} text-white`}>
                                  {completionRate.toFixed(1)}%
                                </Badge>
                              </TableCell>
                              <TableCell>{avgPerStaff.toFixed(1)}</TableCell>
                              <TableCell>{new Date(zone.lastDeliveryDate).toLocaleDateString()}</TableCell>
                            </TableRow>

                            {/* Ward-Level Drilldown */}
                            {expandedZones.includes(zone.id) && (
                              <TableRow>
                                <TableCell colSpan={8} className="p-0">
                                  <div className="bg-muted/30 p-4 border-t">
                                    <h4 className="font-medium mb-3 text-sm flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      Ward Details for {zone.zoneName}
                                    </h4>
                                    <div className="overflow-x-auto">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead className="text-xs">Ward Name</TableHead>
                                            <TableHead className="text-xs">Properties</TableHead>
                                            <TableHead className="text-xs">Deliveries</TableHead>
                                            <TableHead className="text-xs">Paid Count</TableHead>
                                            <TableHead className="text-xs">Completion %</TableHead>
                                            <TableHead className="text-xs">Staff Count</TableHead>
                                            <TableHead className="text-xs">Last Delivery</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {zone.wards.map((ward: any) => {
                                            const wardCompletion = calculateCompletion(
                                              ward.deliveriesCompleted,
                                              ward.totalProperties,
                                            )
                                            return (
                                              <TableRow key={ward.id} className="text-xs">
                                                <TableCell className="font-medium">{ward.wardName}</TableCell>
                                                <TableCell>{ward.totalProperties}</TableCell>
                                                <TableCell>{ward.deliveriesCompleted}</TableCell>
                                                <TableCell>{ward.paidDeliveries}</TableCell>
                                                <TableCell>
                                                  <Badge
                                                    variant="outline"
                                                    className={cn("text-xs", getCompletionColor(wardCompletion))}
                                                  >
                                                    {wardCompletion.toFixed(1)}%
                                                  </Badge>
                                                </TableCell>
                                                <TableCell>{ward.staffCount}</TableCell>
                                                <TableCell>
                                                  {new Date(ward.lastDeliveryDate).toLocaleDateString()}
                                                </TableCell>
                                              </TableRow>
                                            )
                                          })}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visualization Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bar Chart - Deliveries per Ward */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Deliveries per Ward
                </CardTitle>
                <CardDescription>Performance comparison across wards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {wardDeliveryData.slice(0, 8).map((ward, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{ward.wardName}</span>
                        <span>{ward.deliveries}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={(ward.deliveries / Math.max(...wardDeliveryData.map((w) => w.deliveries))) * 100}
                          className="flex-1 h-2"
                        />
                        <Badge variant="outline" className={cn("text-xs", getCompletionColor(ward.completion))}>
                          {ward.completion.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Line Chart - Daily Delivery Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Daily Delivery Trends
                </CardTitle>
                <CardDescription>Last 14 days performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dailyTrends.slice(-7).map((day, index) => {
                    const total = day.zoneA + day.zoneB + day.zoneC + day.zoneD + day.zoneE
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">
                            {new Date(day.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span>{total}</span>
                        </div>
                        <div className="flex gap-1">
                          <div
                            className="bg-blue-500 h-2 rounded-sm"
                            style={{ width: `${(day.zoneA / total) * 100}%` }}
                            title={`Zone A: ${day.zoneA}`}
                          />
                          <div
                            className="bg-green-500 h-2 rounded-sm"
                            style={{ width: `${(day.zoneB / total) * 100}%` }}
                            title={`Zone B: ${day.zoneB}`}
                          />
                          <div
                            className="bg-yellow-500 h-2 rounded-sm"
                            style={{ width: `${(day.zoneC / total) * 100}%` }}
                            title={`Zone C: ${day.zoneC}`}
                          />
                          <div
                            className="bg-orange-500 h-2 rounded-sm"
                            style={{ width: `${(day.zoneD / total) * 100}%` }}
                            title={`Zone D: ${day.zoneD}`}
                          />
                          <div
                            className="bg-red-500 h-2 rounded-sm"
                            style={{ width: `${(day.zoneE / total) * 100}%` }}
                            title={`Zone E: ${day.zoneE}`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>Zone A</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Zone B</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <span>Zone C</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      <span>Zone D</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span>Zone E</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Performance Heatmap
                </CardTitle>
                <CardDescription>Zone completion rates overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredZoneData.map((zone) => {
                    const completionRate = calculateCompletion(zone.deliveriesCompleted, zone.totalProperties)
                    const paidRate = (zone.paidDeliveries / zone.deliveriesCompleted) * 100

                    return (
                      <div key={zone.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{zone.zoneName.split(" - ")[0]}</span>
                          <div className="flex gap-2">
                            <Badge className={`${getCompletionBadgeColor(completionRate)} text-white text-xs`}>
                              {completionRate.toFixed(0)}%
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {paidRate.toFixed(0)}% paid
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {zone.wards.map((ward: any, wardIndex: number) => {
                            const wardCompletion = calculateCompletion(ward.deliveriesCompleted, ward.totalProperties)
                            return (
                              <div
                                key={wardIndex}
                                className={cn(
                                  "h-8 rounded flex items-center justify-center text-xs font-medium cursor-pointer transition-colors hover:opacity-80",
                                  getCompletionColor(wardCompletion),
                                )}
                                title={`${ward.wardName}: ${wardCompletion.toFixed(1)}%`}
                                onClick={() => {
                                  toast({
                                    title: ward.wardName,
                                    description: `Completion: ${wardCompletion.toFixed(1)}% | Deliveries: ${ward.deliveriesCompleted}/${ward.totalProperties}`,
                                  })
                                }}
                              >
                                {wardCompletion.toFixed(0)}%
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-100 dark:bg-red-900/20 rounded" />
                      <span>{"<50%"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-100 dark:bg-yellow-900/20 rounded" />
                      <span>50-90%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-100 dark:bg-green-900/20 rounded" />
                      <span>{">90%"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CommissionerLayout>
    </AuthGuard>
  )
}
