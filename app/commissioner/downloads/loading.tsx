import { AuthGuard } from "@/components/auth-guard"
import CommissionerLayout from "@/components/commissioner-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function CommissionerDownloadsLoading() {
  return (
    <AuthGuard allowedRoles={["commissioner"]}>
      <CommissionerLayout>
        <div className="flex-1 space-y-6 p-4 md:p-6">
          {/* Page Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Report Configuration Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Report Type Selector Skeleton */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>

                  <div className="w-full h-px bg-border" />

                  {/* Filter Controls Skeleton */}
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-32" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Date Range Skeleton */}
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>

                      {/* Zone Selection Skeleton */}
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                      </div>

                      {/* Ward Selection Skeleton */}
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                      </div>

                      {/* Staff Name Skeleton */}
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-border" />

                  {/* Export Options Skeleton */}
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-32" />

                    <div className="p-3 bg-muted rounded-lg space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Skeleton className="h-10 flex-1" />
                      <Skeleton className="h-10 flex-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Download History Skeleton */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-36" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* History Items Skeleton */}
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-3 w-36" />
                          </div>
                          <Skeleton className="h-6 w-16" />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <Skeleton className="h-3 w-12" />
                          <Skeleton className="h-7 w-20" />
                        </div>
                      </div>
                    ))}

                    {/* Pagination Skeleton */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <Skeleton className="h-4 w-24" />
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-12" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </CommissionerLayout>
    </AuthGuard>
  )
}
