"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { StaffLayout } from "@/components/staff-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { apiService, getPhotoUrl } from "@/lib/api"
import {
  Package,
  TrendingUp,
  IndianRupee,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Award,
  MapPin,
  User,
  Phone,
} from "lucide-react"

// Types for API data
interface StaffStats {
  total: number
  today: number
  thisWeek: number
  thisMonth: number
  paid: number
  earnings: number
  corrected: number
  avgPerDay: number
}

interface RecentDelivery {
  _id: string
  property: {
    propertyId: string
    ownerName: string
    address: string
    ward: {
      corporateName: string
      wardName: string
    }
  }
  deliveryDate: string
  dataSource: 'owner' | 'family' | 'tenant' | 'not_found'
  photoUrl: string
}

interface ZoneInfo {
  name: string
  totalProperties: number
  delivered: number
  pending: number
  completion: number
}

export default function StaffDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StaffStats>({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    paid: 0,
    earnings: 0,
    corrected: 0,
    avgPerDay: 0,
  })
  const [recentDeliveries, setRecentDeliveries] = useState<RecentDelivery[]>([])
  const [zoneInfo, setZoneInfo] = useState<ZoneInfo[]>([])
  const [user, setUser] = useState<any>(null)

  // Load data from API
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        
        console.log('Loading dashboard data...')
        
        // Load user data first
        const userData = await apiService.getCurrentUser()
        console.log('User data:', userData)
        setUser(userData)
        
        // Load deliveries for this staff member using staff-history endpoint
        console.log('Fetching staff history...')
        const deliveriesResponse = await apiService.getStaffHistory()
        console.log('Deliveries response:', deliveriesResponse)
        const deliveries = deliveriesResponse.deliveries
        console.log('Deliveries array:', deliveries)

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

        const paidDeliveries = deliveries.filter(d => d.dataSource !== 'not_found')
        const correctedDeliveries = deliveries.filter(d => d.correctionStatus !== 'None')

        const newStats: StaffStats = {
          total: deliveries.length,
          today: todayDeliveries.length,
          thisWeek: weekDeliveries.length,
          thisMonth: monthDeliveries.length,
          paid: paidDeliveries.length,
          earnings: paidDeliveries.length * 10, // Assuming ₹10 per delivery
          corrected: correctedDeliveries.length,
          avgPerDay: deliveries.length > 0 ? Math.round(deliveries.length / Math.max(1, Math.floor((now.getTime() - new Date(deliveries[0]?.deliveryDate || now).getTime()) / (1000 * 60 * 60 * 24)))) : 0,
        }

        console.log('Calculated stats:', newStats)

        // Get recent deliveries (last 5)
        const recent = deliveries
          .sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime())
          .slice(0, 5)

        // Calculate zone info
        const zoneMap = new Map<string, ZoneInfo>()
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
              totalProperties: 0,
              delivered: 0,
              pending: 0,
              completion: 0,
            })
          }
          const zone = zoneMap.get(zoneName)!
          zone.totalProperties++
          if (delivery.dataSource !== 'not_found') {
            zone.delivered++
          } else {
            zone.pending++
          }
          zone.completion = Math.round((zone.delivered / zone.totalProperties) * 100)
        })

        setStats(newStats)
        setRecentDeliveries(recent)
        setZoneInfo(Array.from(zoneMap.values()))

        toast({
          title: "Dashboard Loaded",
          description: "Your delivery data has been refreshed successfully.",
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  // Manual refresh function
  const handleRefresh = async () => {
    try {
      setLoading(true)
      
      // Load user data first
      const userData = await apiService.getCurrentUser()
      setUser(userData)
      
      // Load deliveries for this staff member using staff-history endpoint
      const deliveriesResponse = await apiService.getStaffHistory()
      const deliveries = deliveriesResponse.deliveries

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

      const paidDeliveries = deliveries.filter(d => d.dataSource !== 'not_found')
      const correctedDeliveries = deliveries.filter(d => d.correctionStatus !== 'None')

      const newStats: StaffStats = {
        total: deliveries.length,
        today: todayDeliveries.length,
        thisWeek: weekDeliveries.length,
        thisMonth: monthDeliveries.length,
        paid: paidDeliveries.length,
        earnings: paidDeliveries.length * 10, // Assuming ₹10 per delivery
        corrected: correctedDeliveries.length,
        avgPerDay: deliveries.length > 0 ? Math.round(deliveries.length / Math.max(1, Math.floor((now.getTime() - new Date(deliveries[0]?.deliveryDate || now).getTime()) / (1000 * 60 * 60 * 24)))) : 0,
      }

      // Get recent deliveries (last 5)
      const recent = deliveries
        .sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime())
        .slice(0, 5)

      // Calculate zone info
      const zoneMap = new Map<string, ZoneInfo>()
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
            totalProperties: 0,
            delivered: 0,
            pending: 0,
            completion: 0,
          })
        }
        const zone = zoneMap.get(zoneName)!
        zone.totalProperties++
        if (delivery.dataSource !== 'not_found') {
          zone.delivered++
        } else {
          zone.pending++
        }
        zone.completion = Math.round((zone.delivered / zone.totalProperties) * 100)
      })

      setStats(newStats)
      setRecentDeliveries(recent)
      setZoneInfo(Array.from(zoneMap.values()))

      toast({
        title: "Data Refreshed",
        description: "Dashboard data has been updated successfully.",
      })
    } catch (error) {
      console.error('Error refreshing dashboard:', error)
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
      <AuthGuard allowedRoles={["staff"]}>
        <StaffLayout>
          <div className="p-4 space-y-6">
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
        </StaffLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={["staff"]}>
      <StaffLayout>
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.fullName}! Here's your delivery performance overview.
              </p>
            </div>
            <Button variant="outline" onClick={handleRefresh}>
              <Calendar className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Deliveries</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

          <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Today's Deliveries</p>
                    <p className="text-2xl font-bold">{stats.today}</p>
                    <p className="text-xs text-muted-foreground">Active submissions</p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

            <Card>
              <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">This Week</p>
                    <p className="text-2xl font-bold">{stats.thisWeek}</p>
                    <p className="text-xs text-muted-foreground">Weekly progress</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                    <p className="text-2xl font-bold">₹{stats.earnings}</p>
                    <p className="text-xs text-muted-foreground">Based on deliveries</p>
                  </div>
                  <IndianRupee className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
                </Card>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Deliveries */}
          <Card>
              <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Deliveries
              </CardTitle>
            </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentDeliveries.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No deliveries yet</p>
                    </div>
                  ) : (
                    recentDeliveries.map((delivery) => (
                      <div key={delivery._id} className="flex items-center gap-4 p-3 rounded-lg border">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          {delivery.dataSource === "not_found" ? (
                            <XCircle className="h-6 w-6 text-red-500" />
                          ) : (
                            <CheckCircle className="h-6 w-6 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{delivery.property?.propertyId || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{delivery.property?.ownerName || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">
                            {delivery.property?.ward?.corporateName || 'N/A'} • {delivery.property?.ward?.wardName || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatDate(delivery.deliveryDate)}</p>
                          <Badge
                            variant={delivery.dataSource === "not_found" ? "destructive" : "default"}
                            className="text-xs"
                          >
                            {delivery.dataSource === "not_found" ? "Not Found" : "Delivered"}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Zone Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Zone Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {zoneInfo.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No zone data available</p>
                    </div>
                  ) : (
                    zoneInfo.map((zone) => (
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
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Target className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold">{stats.thisMonth}</p>
                  <p className="text-sm text-muted-foreground">This Month</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Award className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold">{stats.avgPerDay}</p>
                  <p className="text-sm text-muted-foreground">Avg/Day</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                  <p className="text-2xl font-bold">{stats.corrected}</p>
                  <p className="text-sm text-muted-foreground">Corrected Entries</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button className="w-full" onClick={() => window.location.href = '/staff/home'}>
                  <Package className="h-4 w-4 mr-2" />
                  New Delivery
                </Button>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = '/staff/history'}>
                  <Clock className="h-4 w-4 mr-2" />
                  View History
                </Button>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = '/staff/profile'}>
                  <User className="h-4 w-4 mr-2" />
                  My Profile
                </Button>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = '/staff/help'}>
                  <Phone className="h-4 w-4 mr-2" />
                  Get Help
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </StaffLayout>
    </AuthGuard>
  )
}
