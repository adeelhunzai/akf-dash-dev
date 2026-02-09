import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Skeleton */}
      <div className="hidden md:flex flex-col w-64 border-r bg-card h-screen">
        <div className="p-6 h-[72px] flex items-end justify-center">
             <Skeleton className="h-10 w-32 bg-gray-200" />
        </div>
        <div className="flex-1 px-3 py-6 space-y-4">
             {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md bg-gray-100" />
             ))}
        </div>
         <div className="px-3 py-6 space-y-2">
            <Skeleton className="h-10 w-full bg-gray-100" />
            <Skeleton className="h-10 w-full bg-gray-100" />
         </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header Skeleton */}
        <div className="h-[72px] border-b flex items-center justify-between px-6 bg-card">
            <div className="w-10"></div> {/* Spacer */}
            <div className="flex items-center gap-4">
                <Skeleton className="h-9 w-24 rounded-md bg-gray-100" /> {/* Language */}
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full bg-gray-200" />
                    <div className="hidden md:block space-y-1">
                        <Skeleton className="h-3 w-24 bg-gray-200" />
                        <Skeleton className="h-2 w-32 bg-gray-100" />
                    </div>
                </div>
            </div>
        </div>
        
        {/* Content Area Skeleton */}
        <main className="flex-1 overflow-y-auto bg-[#fafafa] p-6 space-y-6">
            <Skeleton className="h-8 w-64 bg-gray-200" /> {/* Page Title */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-40 rounded-xl bg-white shadow-sm" />
                ))}
            </div>
             <Skeleton className="h-64 w-full rounded-xl bg-white shadow-sm" />
        </main>
      </div>
    </div>
  )
}
