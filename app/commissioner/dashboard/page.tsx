"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import CommissionerLayout from "@/components/commissioner-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import {
  BarChart3,
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Award,
  Download,
  RefreshCw,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// Types for API data
interface CommissionerStats {
  totalDeliveries: number
  totalProperties: number
  totalStaff: number
  totalZones: number
  thisMonth: number
  thisWeek: number
  today: number
  completionRate: number
}

interface ZoneData {
  name: string
  totalProperties: number
  delivered: number
  pending: number
  completion: number
  staff: number
}

interface StaffData {
  name: string
  zone: string
  total: number
  delivered: number
  pending: number
  completion: number
}

interface DailyData {
  date: string
  deliveries: number
  properties: number
}

export default function CommissionerDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<CommissionerStats>({
    totalDeliveries: 0,
    totalProperties: 0,
    totalStaff: 0,
    totalZones: 0,
    thisMonth: 0,
    thisWeek: 0,
    today: 0,
    completionRate: 0,
  })
  const [zones, setZones] = useState<ZoneData[]>([])
  const [staff, setStaff] = useState<StaffData[]>([])
  const [dailyData, setDailyData] = useState<DailyData[]>([])

  // Load data from API
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        
        // Load all data from API
        const [propertiesResponse, deliveriesResponse, wardsResponse] = await Promise.all([
          apiService.getProperties(),
          apiService.getDeliveries(),
          apiService.getWards(),
        ])

        const properties = propertiesResponse.properties
        const deliveries = deliveriesResponse.deliveries
        const wards = wardsResponse

        // Calculate stats
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

        const successfulDeliveries = deliveries.filter(d => d.dataSource !== 'not_found')
        const uniqueStaff = Array.from(new Set(deliveries.map(d => d.staff.id)))
        const uniqueZones = Array.from(new Set(properties.map(p => p.ward.corporateName)))

        const newStats: CommissionerStats = {
          totalDeliveries: deliveries.length,
          totalProperties: properties.length,
          totalStaff: uniqueStaff.length,
          totalZones: uniqueZones.length,
          thisMonth: monthDeliveries.length,
          thisWeek: weekDeliveries.length,
          today: todayDeliveries.length,
          completionRate: properties.length > 0 ? Math.round((successfulDeliveries.length / properties.length) * 100) : 0,
        }

        // Calculate zone data
        const zoneMap = new Map<string, ZoneData>()
        properties.forEach(property => {
          const zoneName = property.ward.corporateName
          if (!zoneMap.has(zoneName)) {
            zoneMap.set(zoneName, {
              name: zoneName,
              totalProperties: 0,
              delivered: 0,
              pending: 0,
              completion: 0,
              staff: 0,
            })
          }
          const zone = zoneMap.get(zoneName)!
          zone.totalProperties++
        })

        // Add delivery data to zones
        deliveries.forEach(delivery => {
          if (!delivery.property || !delivery.property.ward) return;
          const zoneName = delivery.property.ward.corporateName
          const zone = zoneMap.get(zoneName)
          if (zone) {
            if (delivery.dataSource !== 'not_found') {
              zone.delivered++
            } else {
              zone.pending++
            }
            zone.completion = Math.round((zone.delivered / zone.totalProperties) * 100)
          }
        })

        // Calculate staff data
        const staffMap = new Map<string, StaffData>()
        deliveries.forEach(delivery => {
          if (!delivery.property || !delivery.property.ward || !delivery.staff) return;
          const staffName = delivery.staff.fullName
          if (!staffMap.has(staffName)) {
            staffMap.set(staffName, {
              name: staffName,
              zone: delivery.property.ward.corporateName,
              total: 0,
              delivered: 0,
              pending: 0,
              completion: 0,
            })
          }
          const staffData = staffMap.get(staffName)!
          staffData.total++
          if (delivery.dataSource !== 'not_found') {
            staffData.delivered++
          } else {
            staffData.pending++
          }
          staffData.completion = Math.round((staffData.delivered / staffData.total) * 100)
        })

        // Calculate daily data for the last 7 days
        const dailyMap = new Map<string, DailyData>()
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          dailyMap.set(dateStr, {
            date: dateStr,
            deliveries: 0,
            properties: 0,
          })
        }

        // Add delivery data to daily map
        deliveries.forEach(delivery => {
          const deliveryDate = new Date(delivery.deliveryDate)
          const dateStr = deliveryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          const daily = dailyMap.get(dateStr)
          if (daily) {
            daily.deliveries++
          }
        })

        setStats(newStats)
        setZones(Array.from(zoneMap.values()))
        setStaff(Array.from(staffMap.values()).sort((a, b) => b.total - a.total).slice(0, 10))
        setDailyData(Array.from(dailyMap.values()))

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

  if (loading) {
    return (
      <AuthGuard allowedRoles={["commissioner"]}>
        <CommissionerLayout>
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-80" />
              <Skeleton className="h-80" />
            </div>
          </div>
        </CommissionerLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={["commissioner"]}>
      <CommissionerLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Commissioner Dashboard</h1>
              <p className="text-muted-foreground">Overview of all delivery operations across the city</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Deliveries</p>
                    <p className="text-2xl font-bold">{stats.totalDeliveries.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Properties</p>
                    <p className="text-2xl font-bold">{stats.totalProperties.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Registered</p>
                  </div>
                  <MapPin className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Active Staff</p>
                    <p className="text-2xl font-bold">{stats.totalStaff}</p>
                    <p className="text-xs text-muted-foreground">Field workers</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                    <p className="text-2xl font-bold">{stats.completionRate}%</p>
                    <p className="text-xs text-muted-foreground">Overall success</p>
                  </div>
                  <Target className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Calendar className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold">{stats.today}</p>
                  <p className="text-sm text-muted-foreground">Today's Deliveries</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold">{stats.thisWeek}</p>
                  <p className="text-sm text-muted-foreground">This Week</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Award className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                  <p className="text-2xl font-bold">{stats.thisMonth}</p>
                  <p className="text-sm text-muted-foreground">This Month</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Deliveries Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Deliveries (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="deliveries" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Zone Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Zone Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {zones.map((zone) => (
                    <div key={zone.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{zone.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {zone.delivered}/{zone.totalProperties}
                        </span>
                      </div>
                      <Progress value={zone.completion} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{zone.delivered} delivered</span>
                        <span>{zone.pending} pending</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Staff */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staff.map((member, index) => (
                  <div key={member.name} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.zone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{member.total} deliveries</p>
                      <p className="text-sm text-muted-foreground">{member.completion}% success</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </CommissionerLayout>
    </AuthGuard>
  )
}
