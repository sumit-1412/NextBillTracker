import { AuthGuard } from "@/components/auth-guard"
import CommissionerLayout from "@/components/commissioner-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function CommissionerPhotosLoading() {
  return (
    <AuthGuard allowedRoles={["commissioner"]}>
      <CommissionerLayout>
        <div className="p-4 space-y-6 bg-background">
          {/* Page Header Skeleton */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>

          {/* Filter Controls Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {Array.from({ length: 7 }, (_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-4 w-48" />
            </CardContent>
          </Card>

          {/* View Toggle Skeleton */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-16" />
            </div>
          </div>

          {/* Photo Grid Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 20 }, (_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Skeleton */}
          <div className="flex justify-center">
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </div>
      </CommissionerLayout>
    </AuthGuard>
  )
}
