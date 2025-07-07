"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import {
  Package,
  TrendingUp,
  IndianRupee,
  Calendar,
  Search,
  Trophy,
  BarChart3,
  PieChart,
  Loader2,
  CheckCircle,
  Edit3,
} from "lucide-react"
import {
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// Types for API data
interface DashboardStats {
  total: number
  today: number
  thisWeek: number
  thisMonth: number
  paid: number
  earnings: number
  corrected: number
}

interface ZoneData {
  name: string
  deliveries: number
  paid: number
  staff: number
  earnings: number
  completion: number
}

interface StaffData {
  name: string
  zone: string
  ward: string
  total: number
  paid: number
  earnings: number
}

interface DailyDelivery {
  date: string
  count: number
}

interface ZoneDistribution {
  name: string
  value: number
  color: string
}

interface WardData {
  name: string
  properties: number
  deliveries: number
  paid: number
  earnings: number
}

export default function AdminDashboard() {
  const { toast } = useToast()

  // State Management
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState("week")
  const [zoneFilter, setZoneFilter] = useState("all")
  const [searchZone, setSearchZone] = useState("")
  const [staffSortBy, setStaffSortBy] = useState("total")
  const [selectedZoneTab, setSelectedZoneTab] = useState("Zone A")

  // Data State
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    paid: 0,
    earnings: 0,
    corrected: 0,
  })
  const [zones, setZones] = useState<ZoneData[]>([])
  const [staff, setStaff] = useState<StaffData[]>([])
  const [dailyDeliveries, setDailyDeliveries] = useState<DailyDelivery[]>([])
  const [zoneDistribution, setZoneDistribution] = useState<ZoneDistribution[]>([])
  const [wardDataByZone, setWardDataByZone] = useState<Record<string, WardData[]>>({})

  // Load Data from API
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        
        // Load properties and deliveries data
        const [propertiesResponse, deliveriesResponse] = await Promise.all([
          apiService.getProperties(),
          apiService.getDeliveries(),
        ])

        const properties = propertiesResponse.properties
        const deliveries = deliveriesResponse.deliveries

        // Calculate dashboard stats
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

        const todayDeliveries = deliveries.filter(d => 
          new Date(d.deliveryDate) >= today
        )
        const weekDeliveries = deliveries.filter(d => 
          new Date(d.deliveryDate) >= weekAgo
        )
        const monthDeliveries = deliveries.filter(d => 
          new Date(d.deliveryDate) >= monthAgo
        )

        const newStats: DashboardStats = {
          total: deliveries.length,
          today: todayDeliveries.length,
          thisWeek: weekDeliveries.length,
          thisMonth: monthDeliveries.length,
          paid: deliveries.filter(d => d.dataSource !== 'not_found').length,
          earnings: deliveries.filter(d => d.dataSource !== 'not_found').length * 10, // Assuming ₹10 per delivery
          corrected: deliveries.filter(d => d.correctionStatus !== 'None').length,
        }

        // Calculate zone data
        const zoneMap = new Map<string, ZoneData>()
        deliveries.forEach(delivery => {
          // Add null checks for delivery.property and delivery.property.ward
          if (!delivery.property || !delivery.property.ward) {
            console.warn('Delivery missing property or ward data:', delivery._id)
            return // Skip this delivery
          }
          
          const zoneName = delivery.property.ward.corporateName
          if (!zoneMap.has(zoneName)) {
            zoneMap.set(zoneName, {
              name: zoneName,
              deliveries: 0,
              paid: 0,
              staff: 0,
              earnings: 0,
              completion: 0,
            })
          }
          const zone = zoneMap.get(zoneName)!
          zone.deliveries++
          if (delivery.dataSource !== 'not_found') {
            zone.paid++
          }
          zone.earnings = zone.paid * 10
          zone.completion = Math.round((zone.paid / zone.deliveries) * 100)
        })

        // Calculate staff data
        const staffMap = new Map<string, StaffData>()
        deliveries.forEach(delivery => {
          // Add null checks for delivery.staff and delivery.property
          if (!delivery.staff || !delivery.property || !delivery.property.ward) {
            console.warn('Delivery missing staff or property data:', delivery._id)
            return // Skip this delivery
          }
          
          const staffName = delivery.staff.fullName
          if (!staffMap.has(staffName)) {
            staffMap.set(staffName, {
              name: staffName,
              zone: delivery.property.ward.corporateName,
              ward: delivery.property.ward.wardName,
              total: 0,
              paid: 0,
              earnings: 0,
            })
          }
          const staffData = staffMap.get(staffName)!
          staffData.total++
          if (delivery.dataSource !== 'not_found') {
            staffData.paid++
          }
          staffData.earnings = staffData.paid * 10
        })

        // Calculate daily deliveries for the last 7 days
        const dailyData: DailyDelivery[] = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
          const dayDeliveries = deliveries.filter(d => {
            const deliveryDate = new Date(d.deliveryDate)
            return deliveryDate.getDate() === date.getDate() &&
                   deliveryDate.getMonth() === date.getMonth() &&
                   deliveryDate.getFullYear() === date.getFullYear()
          })
          dailyData.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            count: dayDeliveries.length,
          })
        }

        // Calculate zone distribution for pie chart
        const zoneDistData: ZoneDistribution[] = Array.from(zoneMap.values()).map((zone, index) => ({
          name: zone.name,
          value: zone.deliveries,
          color: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'][index % 4],
        }))

        // Calculate ward data by zone
        const wardDataByZoneCalc: Record<string, WardData[]> = {}

        properties.forEach(property => {
          // Add null checks for property.ward
          if (!property.ward) {
            console.warn('Property missing ward data:', property._id)
            return // Skip this property
          }
          
          const zoneName = property.ward.corporateName
          const wardName = property.ward.wardName
          
          if (!wardDataByZoneCalc[zoneName]) {
            wardDataByZoneCalc[zoneName] = []
          }
          
          let ward = wardDataByZoneCalc[zoneName].find(w => w.name === wardName)
          if (!ward) {
            ward = { name: wardName, properties: 0, deliveries: 0, paid: 0, earnings: 0 }
            wardDataByZoneCalc[zoneName].push(ward)
          }
          ward.properties++
        })

        deliveries.forEach(delivery => {
          // Add null checks for delivery.property and delivery.property.ward
          if (!delivery.property || !delivery.property.ward) {
            console.warn('Delivery missing property or ward data:', delivery._id)
            return // Skip this delivery
          }
          
          const zoneName = delivery.property.ward.corporateName
          const wardName = delivery.property.ward.wardName
          
          if (wardDataByZoneCalc[zoneName]) {
            const ward = wardDataByZoneCalc[zoneName].find(w => w.name === wardName)
            if (ward) {
              ward.deliveries++
              if (delivery.dataSource !== 'not_found') {
                ward.paid++
              }
              ward.earnings = ward.paid * 10
            }
          }
        })

        setStats(newStats)
        setZones(Array.from(zoneMap.values()))
        setStaff(Array.from(staffMap.values()))
        setDailyDeliveries(dailyData)
        setZoneDistribution(zoneDistData)
        setWardDataByZone(wardDataByZoneCalc)

        toast({
          title: "Dashboard Loaded",
          description: "All data has been refreshed successfully.",
        })
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [toast])

  // Filter zones based on search
  const filteredZones = zones.filter((zone) => zone.name.toLowerCase().includes(searchZone.toLowerCase()))

  // Sort staff based on selection
  const sortedStaff = [...staff].sort((a, b) => {
    if (staffSortBy === "total") return b.total - a.total
    if (staffSortBy === "earnings") return b.earnings - a.earnings
    return 0
  })

  // Summary Cards Data
  const summaryCards = [
    {
      title: "Total Deliveries",
      value: stats.total.toLocaleString(),
      subtext: "+5% from last week",
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Deliveries Today",
      value: stats.today.toString(),
      subtext: "Active submissions",
      icon: Calendar,
      color: "text-green-600",
    },
    {
      title: "This Week",
      value: stats.thisWeek.toString(),
      subtext: "Weekly progress",
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      title: "This Month",
      value: stats.thisMonth.toString(),
      subtext: "Monthly target: 1000",
      icon: BarChart3,
      color: "text-orange-600",
    },
    {
      title: "Paid Deliveries",
      value: stats.paid.toString(),
      subtext: `${Math.round((stats.paid / stats.total) * 100)}% completion`,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Total Earnings",
      value: `₹${stats.earnings.toLocaleString()}`,
      subtext: "Staff payments",
      icon: IndianRupee,
      color: "text-green-600",
    },
    {
      title: "Corrected Entries",
      value: stats.corrected.toString(),
      subtext: `${Math.round((stats.corrected / stats.total) * 100)}% correction rate`,
      icon: Edit3,
      color: "text-yellow-600",
    },
  ]

  if (loading) {
    return (
      <AuthGuard allowedRoles={["admin"]}>
        <AdminLayout>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-64" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-80" />
              <Skeleton className="h-80" />
            </div>
          </div>
        </AdminLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">Overview of all delivery operations and performance</p>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <Loader2 className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date-filter">Date Range</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="zone-filter">Zone Filter</Label>
                  <Select value={zoneFilter} onValueChange={setZoneFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All zones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Zones</SelectItem>
                      {zones.map((zone) => (
                        <SelectItem key={zone.name} value={zone.name}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="search-zone">Search Zone</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search-zone"
                      placeholder="Search zones..."
                      value={searchZone}
                      onChange={(e) => setSearchZone(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {summaryCards.map((card, index) => {
              const Icon = card.icon
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                        <p className="text-2xl font-bold">{card.value}</p>
                        <p className="text-xs text-muted-foreground">{card.subtext}</p>
                      </div>
                      <Icon className={`h-8 w-8 ${card.color}`} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Zone-Wise Overview Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Zone-Wise Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zone Name</TableHead>
                      <TableHead>Total Deliveries</TableHead>
                      <TableHead>Paid Deliveries</TableHead>
                      <TableHead>Staff Assigned</TableHead>
                      <TableHead>Total Earnings</TableHead>
                      <TableHead>% Completion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredZones.map((zone) => (
                      <TableRow key={zone.name}>
                        <TableCell className="font-medium">{zone.name}</TableCell>
                        <TableCell>{zone.deliveries}</TableCell>
                        <TableCell>{zone.paid}</TableCell>
                        <TableCell>{zone.staff}</TableCell>
                        <TableCell>₹{zone.earnings.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={zone.completion >= 90 ? "default" : "secondary"}>{zone.completion}%</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Ward-Wise Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Ward-Wise Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedZoneTab} onValueChange={setSelectedZoneTab}>
                <TabsList className="grid w-full grid-cols-4">
                  {Object.keys(wardDataByZone).map((zone) => (
                    <TabsTrigger key={zone} value={zone}>
                      {zone}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {Object.entries(wardDataByZone).map(([zone, wards]) => (
                  <TabsContent key={zone} value={zone} className="mt-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ward Name</TableHead>
                            <TableHead>Properties</TableHead>
                            <TableHead>Deliveries</TableHead>
                            <TableHead>Paid</TableHead>
                            <TableHead>Earnings</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {wards.map((ward) => (
                            <TableRow key={ward.name}>
                              <TableCell className="font-medium">{ward.name}</TableCell>
                              <TableCell>{ward.properties}</TableCell>
                              <TableCell>{ward.deliveries}</TableCell>
                              <TableCell>{ward.paid}</TableCell>
                              <TableCell>₹{ward.earnings}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Charts and Top Staff */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Staff */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Top Staff Performers
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={staffSortBy === "total" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStaffSortBy("total")}
                  >
                    Sort by Submissions
                  </Button>
                  <Button
                    variant={staffSortBy === "earnings" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStaffSortBy("earnings")}
                  >
                    Sort by Earnings
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedStaff.slice(0, 7).map((member, index) => (
                    <div key={member.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.zone} • {member.ward}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{member.total} deliveries</p>
                        <p className="text-sm text-muted-foreground">₹{member.earnings}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Daily Deliveries Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Deliveries (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyDeliveries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Zone Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Zone-Wise Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsPieChart>
                  <Pie
                    data={zoneDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {zoneDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
} 