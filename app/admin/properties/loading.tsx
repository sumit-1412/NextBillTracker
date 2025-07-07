import { AuthGuard } from "@/components/auth-guard"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminPropertiesLoading() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="p-4 space-y-4">
          {/* Page Header Skeleton */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Filters Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Column Visibility Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Table Skeleton */}
          <Card>
            <CardContent className="p-0">
              <div className="space-y-2">
                {/* Table Header */}
                <div className="flex gap-4 p-4 border-b">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-20 flex-1" />
                  ))}
                </div>

                {/* Table Rows */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex gap-4 p-4">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <Skeleton key={j} className="h-4 w-20 flex-1" />
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
