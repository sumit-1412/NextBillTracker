"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { StaffLayout } from "@/components/staff-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import {
  User,
  Phone,
  MapPin,
  Clock,
  Package,
  CheckCircle,
  IndianRupee,
  Shield,
  HelpCircle,
  RefreshCw,
  LogOut,
  AlertCircle,
} from "lucide-react"

// Types for API data
interface UserProfile {
  id: string
  email: string
  fullName: string
  staffId?: string
  role: 'staff' | 'admin' | 'commissioner'
  isActive: boolean
}

interface ProfileStats {
  total: number
  paid: number
  unpaid: number
  corrected: number
  earnings: number
  thisMonth: number
  avgPerDay: number
}

export default function StaffProfile() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<ProfileStats | null>(null)

  const loadProfileData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Load user data and staff's own deliveries
      const [userData, deliveriesResponse] = await Promise.all([
        apiService.getCurrentUser(),
        apiService.getStaffHistory(), // Changed from getDeliveries() to getStaffHistory()
      ])

      setUser(userData as UserProfile)
      const deliveries = deliveriesResponse.deliveries

      // Calculate stats
      const now = new Date()
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const monthDeliveries = deliveries.filter(d => 
        new Date(d.deliveryDate) >= monthAgo
      )

      const paidDeliveries = deliveries.filter(d => d.dataSource !== 'not_found')
      const correctedDeliveries = deliveries.filter(d => d.correctionStatus !== 'None')

      const newStats: ProfileStats = {
        total: deliveries.length,
        paid: paidDeliveries.length,
        unpaid: deliveries.length - paidDeliveries.length,
        corrected: correctedDeliveries.length,
        earnings: paidDeliveries.length * 10, // Assuming ₹10 per delivery
        thisMonth: monthDeliveries.length,
        avgPerDay: deliveries.length > 0 ? Math.round(deliveries.length / Math.max(1, Math.floor((now.getTime() - new Date(deliveries[0]?.deliveryDate || now).getTime()) / (1000 * 60 * 60 * 24)))) : 0,
      }

      setStats(newStats)
    } catch (error) {
      console.error('Error loading profile data:', error)
      setError('Failed to load profile data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProfileData()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login"
  }

  const handleRefreshProfile = () => {
    loadProfileData()
    toast({
      title: "Profile Refreshed",
      description: "Your profile data has been updated.",
    })
  }

  const handleChangePassword = () => {
    toast({
      title: "Password Change",
      description: "Password change functionality will be implemented soon.",
    })
  }

  const handleContactSupport = () => {
    toast({
      title: "Contact Support",
      description: "Support contact functionality will be implemented soon.",
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

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const ProfileInfoSkeleton = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </CardContent>
    </Card>
  )

  const DeliveryStatsSkeleton = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <AuthGuard allowedRoles={["staff"]}>
        <StaffLayout>
          <div className="p-4 space-y-4 pb-20">
            <h2 className="text-xl font-semibold text-foreground">My Profile</h2>
            <ProfileInfoSkeleton />
            <DeliveryStatsSkeleton />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </StaffLayout>
      </AuthGuard>
    )
  }

  if (error || !user || !stats) {
    return (
      <AuthGuard allowedRoles={["staff"]}>
        <StaffLayout>
          <div className="p-4 space-y-4 pb-20">
            <h2 className="text-xl font-semibold text-foreground">My Profile</h2>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error || "Failed to load profile"}</span>
                <Button variant="outline" size="sm" onClick={loadProfileData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>

            <Button onClick={handleLogout} variant="default" className="w-full mt-6">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </StaffLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={["staff"]}>
      <StaffLayout>
        <div className="p-4 space-y-4 pb-20">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">My Profile</h2>
            <Button variant="ghost" size="sm" onClick={handleRefreshProfile}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Profile Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Name</span>
                <span className="font-semibold">{user.fullName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Employee ID</span>
                <span className="font-semibold">{user.staffId || "—"}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Email
                </span>
                <span className="font-semibold">{user.email}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Role
                </span>
                <span className="font-semibold capitalize">{user.role}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={user.isActive ? "default" : "secondary"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last Login
                </span>
                <span className="font-semibold text-sm text-right">
                  {formatDate(new Date().toISOString())}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                Delivery Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Deliveries</span>
                <span className="text-xl font-semibold">{stats.total}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Successful Deliveries
                </span>
                <span className="text-xl font-semibold text-green-600">{stats.paid}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Failed Deliveries</span>
                <span className="text-xl font-semibold text-red-600">{stats.unpaid}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Corrected Entries</span>
                <span className="text-xl font-semibold text-orange-600">{stats.corrected}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <IndianRupee className="h-3 w-3 text-green-600" />
                  Total Earnings
                </span>
                <span className="text-xl font-semibold text-green-600">₹{stats.earnings}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div className="text-center">
                  <div className="text-lg font-semibold">{stats.thisMonth}</div>
                  <p className="text-xs text-muted-foreground">This Month</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{stats.avgPerDay}</div>
                  <p className="text-xs text-muted-foreground">Avg/Day</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleChangePassword}>
                <Shield className="h-4 w-4 mr-3" />
                Change Password
              </Button>

              <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleContactSupport}>
                <HelpCircle className="h-4 w-4 mr-3" />
                Contact Support
              </Button>

              <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleRefreshProfile}>
                <RefreshCw className="h-4 w-4 mr-3" />
                Refresh Profile
              </Button>
            </CardContent>
          </Card>

          {/* Logout Button */}
          <Button onClick={handleLogout} variant="default" className="w-full mt-6">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </StaffLayout>
    </AuthGuard>
  )
}
