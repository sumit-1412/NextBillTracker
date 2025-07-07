import { AuthGuard } from "@/components/auth-guard"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminPhotosLoading() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="p-4 space-y-6">
          {/* Page Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>

          {/* Filters Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-16" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>

          {/* Photo Gallery Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full h-32" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
