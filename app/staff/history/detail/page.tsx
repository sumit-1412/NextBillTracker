"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { StaffLayout } from "@/components/staff-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { apiService, getPhotoUrl } from "@/lib/api"
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Edit3,
  Camera,
  MapPin,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  ZoomIn,
} from "lucide-react"

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

export default function DeliveryDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // State management
  const [delivery, setDelivery] = useState<APIDelivery | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [showPhotoModal, setShowPhotoModal] = useState(false)

  // Get delivery ID from URL params
  const deliveryId = searchParams.get("id")

  useEffect(() => {
    if (deliveryId) {
      fetchDeliveryDetail()
    } else {
      setError("No delivery ID provided")
      setIsLoading(false)
    }
  }, [deliveryId])

  const fetchDeliveryDetail = async () => {
    if (!deliveryId) return

    setIsLoading(true)
    setError("")

    try {
      // Call the real API to get delivery details
      const deliveryData = await apiService.getDeliveryById(deliveryId)
      setDelivery(deliveryData)
      toast({
        title: "Delivery Details Loaded",
        description: `Loaded details for ${deliveryData.property?.propertyId || 'N/A'}`,
      })
    } catch (err) {
      console.error('Error fetching delivery details:', err)
      setError("Delivery not found")
      toast({
        title: "Error Loading Details",
        description: "Failed to fetch delivery information.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const openInGoogleMaps = () => {
    if (delivery?.location?.coordinates && delivery.location.coordinates.length === 2) {
      const url = `https://www.google.com/maps?q=${delivery.location.coordinates[1]},${delivery.location.coordinates[0]}`
      window.open(url, "_blank")
      toast({
        title: "Opening Maps",
        description: "Redirecting to Google Maps...",
      })
    }
  }

  const handlePhotoClick = () => {
    setShowPhotoModal(true)
    toast({
      title: "Photo Viewer",
      description: "Click outside to close",
    })
  }

  // Loading skeleton
  const PropertyInfoSkeleton = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
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
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <Skeleton className="h-6 w-48" />
            </div>
            <PropertyInfoSkeleton />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </StaffLayout>
      </AuthGuard>
    )
  }

  if (error || !delivery) {
    return (
      <AuthGuard allowedRoles={["staff"]}>
        <StaffLayout>
          <div className="p-4 space-y-4 pb-20">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Deliveries
            </Button>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error || "Delivery not found"}</span>
                <Button variant="outline" size="sm" onClick={fetchDeliveryDetail}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </StaffLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={["staff"]}>
      <StaffLayout>
        <div className="p-4 space-y-4 pb-20">
          {/* Back Navigation */}
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Deliveries
          </Button>

          {/* Property Info Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                Property Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Property ID</span>
                <span className="font-semibold">{delivery.property?.propertyId || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Owner Name</span>
                <span className="font-semibold">{delivery.property?.ownerName || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Address</span>
                <span className="font-semibold text-right max-w-[60%]">{delivery.property?.address || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Payment Status</span>
                <Badge variant={delivery.property?.deliveryStatus === 'Delivered' ? "default" : "destructive"} className="text-xs">
                  {delivery.property?.deliveryStatus === 'Delivered' ? (
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
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Mobile 1</span>
                <span className="font-semibold">{delivery.property?.mobileNo || "Not provided"}</span>
              </div>

                             {delivery.receiverMobile && (
                 <div className="flex justify-between items-center">
                   <span className="text-muted-foreground">Mobile 2</span>
                   <span className="font-semibold">{delivery.receiverMobile}</span>
                 </div>
               )}

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Zone</span>
                <span className="font-semibold">{delivery.property?.ward?.corporateName || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Ward</span>
                <span className="font-semibold">{delivery.property?.ward?.wardName || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Mohalla</span>
                <span className="font-semibold">{delivery.property?.mohalla || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-muted-foreground">Submitted At</span>
                <span className="font-semibold text-right">{formatDate(delivery.deliveryDate)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Correction Details Section */}
          {delivery.correctionStatus !== 'None' && delivery.correctionStatus !== 'Pending' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-orange-600" />
                  Corrections Made
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="destructive" className="text-xs">
                    Old
                  </Badge>
                  <span className="text-muted-foreground line-through">{delivery.property?.ownerName || 'N/A'}</span>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="default" className="text-xs">
                    New
                  </Badge>
                  <span className="font-medium">{delivery.property?.ownerName || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="destructive" className="text-xs">
                    Old
                  </Badge>
                  <span className="text-muted-foreground line-through">{delivery.property?.address || 'N/A'}</span>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="default" className="text-xs">
                    New
                  </Badge>
                  <span className="font-medium">{delivery.property?.address || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="destructive" className="text-xs">
                    Old
                  </Badge>
                  <span className="text-muted-foreground line-through">{delivery.property?.mobileNo || 'N/A'}</span>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="default" className="text-xs">
                    New
                  </Badge>
                  <span className="font-medium">{delivery.property?.mobileNo || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photo Proof Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-green-600" />
                Delivery Photo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <img
                  src={getPhotoUrl(delivery.photoUrl) || "/placeholder.svg"}
                  alt={`Delivery photo for ${delivery.property?.propertyId || 'N/A'}`}
                  className="w-full h-64 object-cover rounded-md shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={handlePhotoClick}
                />
                <Button variant="secondary" size="sm" className="absolute top-2 right-2" onClick={handlePhotoClick}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Submitted photo at delivery time</p>
            </CardContent>
          </Card>

          {/* Location Info Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                GPS Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground text-sm">Latitude</span>
                  <p className="font-mono text-sm font-medium">{delivery.location?.coordinates?.[1] || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Longitude</span>
                  <p className="font-mono text-sm font-medium">{delivery.location?.coordinates?.[0] || 'N/A'}</p>
                </div>
              </div>

              <Button onClick={openInGoogleMaps} className="w-full bg-transparent" variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Google Maps
              </Button>

              {/* Static Map Preview */}
              <div className="mt-4">
                <img
                  src={`/placeholder.svg?height=200&width=400&query=map location ${delivery.location?.coordinates?.[1] || 'N/A'} ${delivery.location?.coordinates?.[0] || 'N/A'}`}
                  alt="Location map"
                  className="w-full h-32 object-cover rounded-md border"
                />
                <p className="text-xs text-muted-foreground mt-1">Static map preview</p>
              </div>
            </CardContent>
          </Card>

          {/* Photo Modal */}
          {showPhotoModal && (
            <div
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
              onClick={() => setShowPhotoModal(false)}
            >
              <div className="relative max-w-full max-h-full">
                <img
                  src={getPhotoUrl(delivery.photoUrl) || "/placeholder.svg"}
                  alt={`Full size delivery photo for ${delivery.property?.propertyId || 'N/A'}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setShowPhotoModal(false)}
                >
                  ✕
                </Button>
              </div>
            </div>
          )}
        </div>
      </StaffLayout>
    </AuthGuard>
  )
}
