"use client"

import { Card } from "@/components/ui/card"
import { Star, Laptop, UserPlus, Trophy } from "lucide-react"
import { useGetCoursePopularityQuery } from "@/lib/store/api/reportsApi"
import { Skeleton } from "@/components/ui/skeleton"

// Map Tailwind color classes to hex values for dynamic usage
const tailwindColorMap: Record<string, string> = {
  "bg-yellow-400": "#facc15",
  "bg-green-400": "#4ade80",
  "bg-blue-400": "#60a5fa",
  "bg-pink-500": "#ec4899",
  "bg-cyan-500": "#06b6d4",
  "bg-purple-500": "#a855f7",
  "bg-orange-500": "#f97316",
  "bg-indigo-500": "#6366f1",
  "bg-red-400": "#f87171",
  "bg-teal-500": "#14b8a6",
  // Additional colors for future use
  "bg-gray-400": "#9ca3af",
  "bg-lime-500": "#84cc16",
  "bg-amber-500": "#f59e0b",
  "bg-emerald-500": "#10b981",
  "bg-rose-500": "#f43f5e",
  "bg-violet-500": "#8b5cf6",
  "bg-sky-500": "#0ea5e9",
  "bg-fuchsia-500": "#d946ef",
}

const getColorFromClass = (colorClass: string): string => {
  return tailwindColorMap[colorClass] || "#9ca3af" // fallback to gray
}

export function CoursePopularityTable() {
  const { data, isLoading, error } = useGetCoursePopularityQuery()

  if (error) {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-foreground">Course Popularity Report</h3>
        <div className="p-8 text-center text-red-600">
          <p>Error loading course popularity report. Please try again later.</p>
        </div>
      </div>
    )
  }

  const metrics_data = data?.data?.metrics || {
    totalCourses: 0,
    totalEnrollments: 0,
    avgCompletionRate: 0,
    avgRating: 0,
  }

  const topCourses_data = data?.data?.topCourses || []
  const categories_data = data?.data?.categories || []

  const metrics = [
    {
      label: "Total Courses",
      value: metrics_data.totalCourses.toLocaleString(),
      change: "",
      icon: Laptop,
      bgColor: "#98D44E",
      iconColor: "text-white",
    },
    {
      label: "Total Enrollments",
      value: metrics_data.totalEnrollments.toLocaleString(),
      change: "",
      icon: UserPlus,
      bgColor: "#FDC300",
      iconColor: "text-white",
    },
    {
      label: "AVG Completion Rate",
      value: `${metrics_data.avgCompletionRate}%`,
      change: "",
      icon: Trophy,
      bgColor: "#C4A2EA",
      iconColor: "text-white",
    },
    {
      label: "AVG Rating",
      value: metrics_data.avgRating > 0 ? metrics_data.avgRating.toFixed(1) : "N/A",
      change: metrics_data.avgRating > 0 ? "Based on reviews" : "No ratings available",
      icon: Star,
      bgColor: "#1275DB",
      iconColor: "text-white",
    },
  ]

  return (
    <div className="rounded-md border border-gray-200 bg-white p-6 space-y-6">
      <h3 className="text-xl font-semibold text-foreground">Course Popularity Report</h3>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="p-6">
              <Skeleton className="h-20 w-full" />
            </Card>
          ))
        ) : (
          metrics.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <Card key={index} className="p-6 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{metric.value}</p>
                    {metric.change && (
                      <p className="mt-2 text-xs text-green-600">{metric.change}</p>
                    )}
                  </div>
                  <div 
                    className="rounded-lg p-3 flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: metric.bgColor }}
                  >
                    <IconComponent className={`h-6 w-6 ${metric.iconColor}`} />
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Performing Courses */}
        <Card className="p-6">
          <h4 className="mb-6 text-lg font-semibold text-foreground">Top Performing Courses</h4>
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 rounded-lg border border-gray-200 bg-[#F9FAFB] p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              ))
            ) : topCourses_data.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No courses found</p>
            ) : (
              topCourses_data.map((course) => (
                <div key={course.id} className="flex items-center gap-4 rounded-lg border border-gray-200 bg-[#F9FAFB] p-4 hover:shadow-sm transition-shadow">
                  {/* Rank Badge */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0" style={{ backgroundColor: '#e0f3e8' }}>
                    <span className="text-base font-semibold" style={{ color: '#00b140' }}>{course.rank}</span>
                  </div>
                  
                  {/* Course Info */}
                  <div className="flex-1 min-w-0">
                    {course.url ? (
                      <a 
                        href={course.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-semibold text-foreground text-base mb-1 truncate block hover:text-primary hover:underline transition-colors"
                      >
                        {course.name}
                      </a>
                    ) : (
                      <h5 className="font-semibold text-foreground text-base mb-1 truncate">{course.name}</h5>
                    )}
                    <p className="text-sm text-muted-foreground">{course.enrolled.toLocaleString()} enrolled</p>
                  </div>
                  
                  {/* Rating and Completion */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const rating = course.rating || 0;
                        const starIndex = i;
                        const isFilled = starIndex < Math.floor(rating);
                        const isPartial = starIndex === Math.floor(rating) && rating % 1 > 0;
                        const partialFill = isPartial ? (rating % 1) * 100 : 0;
                        
                        return (
                          <div key={i} className="relative inline-block h-4 w-4">
                            {/* Empty star background */}
                            <Star className="h-4 w-4 text-gray-300" />
                            {/* Filled/partial star overlay */}
                            {(isFilled || isPartial) && (
                              <div 
                                className="absolute top-0 left-0 overflow-hidden"
                                style={{ width: isFilled ? '100%' : `${partialFill}%` }}
                              >
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <span className="ml-1 text-sm font-semibold text-foreground">
                        {course.rating > 0 ? course.rating.toFixed(1) : "N/A"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{course.completionRate}% completion</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Course Categories */}
        <Card className="p-6">
          <h4 className="mb-6 text-lg font-semibold text-foreground">Course Categories</h4>
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Skeleton className="h-4 w-4 rounded-sm" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-1/3 mb-2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))
            ) : categories_data.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No categories found</p>
            ) : (
              categories_data.map((category, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div 
                    className="h-4 w-4 rounded-sm flex-shrink-0 mt-1" 
                    style={{ backgroundColor: getColorFromClass(category.color) }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{category.name}</p>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{category.courses} {category.courses === 1 ? 'course' : 'courses'}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{category.enrollments.toLocaleString()} enrollments</span>
                      <span className="text-muted-foreground">{category.avgCompletion}% avg completion</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
