"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Loader2, AlertCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useGetMyCoursesQuery } from "@/lib/store/api/coursesApi"
import { MyCourse } from "@/lib/types/courses.types"

type CourseStatus = "all" | "in-progress" | "completed"

export default function MyCoursesContent() {
  const [activeFilter, setActiveFilter] = useState<CourseStatus>("all")
  const [page, setPage] = useState(1)
  const [allCourses, setAllCourses] = useState<MyCourse[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isFilterChanging, setIsFilterChanging] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)
  const prevFilterRef = useRef<CourseStatus>(activeFilter)

  // Use RTK Query with proper caching - RTK Query will cache each unique combination of parameters
  // currentData gives us the most recent data for the current query arguments (including cached)
  const { data, currentData, isLoading, isFetching, isError, error, refetch } = useGetMyCoursesQuery({
    page,
    per_page: 12,
    status: activeFilter,
  }, {
    // Prevent refetch on window focus or reconnect if data is already available
    refetchOnFocus: false,
    refetchOnReconnect: false,
    // Don't automatically refetch when arguments change - use cached data if available
    // This ensures we use cached data when switching between filters
    refetchOnMountOrArgChange: false,
  })

  // Use currentData if available, otherwise fall back to data
  // currentData is the most recent data for the current query arguments
  const displayData = currentData || data

  // Reset page when filter changes
  useEffect(() => {
    // Only reset if filter actually changed
    if (prevFilterRef.current !== activeFilter) {
      prevFilterRef.current = activeFilter
      setPage(1)
      setHasMore(true)
      setIsFilterChanging(true)
      // Clear courses immediately to prevent showing stale data
      setAllCourses([])
    }
  }, [activeFilter])

  // Check for cached data immediately after filter change
  // This runs after RTK Query has had a chance to update currentData
  useEffect(() => {
    // If we're on page 1 and have cached data for the current filter, use it immediately
    if (page === 1 && isFilterChanging && currentData?.data) {
      const uniqueCourses = currentData.data.filter((course, index, self) => 
        index === self.findIndex(c => c.id === course.id)
      )
      setAllCourses(uniqueCourses)
      setHasMore(currentData.pagination.current_page < currentData.pagination.total_pages)
      setIsFilterChanging(false)
    }
  }, [currentData, page, isFilterChanging, activeFilter])

  // Update courses when data changes - RTK Query caches each page separately
  // This effect runs when data changes (from cache or new fetch)
  // It handles both filter changes and pagination
  useEffect(() => {
    // Only process data if it matches the current filter and page
    // RTK Query returns cached data immediately, so this will work for quick filter switches
    if (displayData?.data) {
      if (page === 1) {
        // For page 1, always replace courses (handles filter changes)
        const uniqueCourses = displayData.data.filter((course, index, self) => 
          index === self.findIndex(c => c.id === course.id)
        )
        setAllCourses(uniqueCourses)
        setIsFilterChanging(false) // Data loaded (from cache or fetch), filter change complete
      } else {
        // For subsequent pages, append new courses
        setAllCourses((prev) => {
          const existingIds = new Set(prev.map(course => course.id))
          const newCourses = displayData.data.filter(course => !existingIds.has(course.id))
          return [...prev, ...newCourses]
        })
      }
      // Update hasMore based on pagination - works for all filters (all, in-progress, completed)
      setHasMore(displayData.pagination.current_page < displayData.pagination.total_pages)
    } else if (displayData && (!displayData.data || displayData.data.length === 0)) {
      // If API returns empty data, no more pages
      if (page === 1) {
        setAllCourses([])
        setIsFilterChanging(false)
      }
      setHasMore(false)
    }
  }, [displayData, page, activeFilter]) // Added activeFilter to ensure effect runs on filter change

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetching && !isFilterChanging) {
          setPage((prev) => prev + 1)
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, isFetching, isFilterChanging])

  // Get icon component (default to BookOpen)
  const getIcon = () => BookOpen

  const Icon = getIcon()

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
        
        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeFilter === "all"
                ? "bg-green-600 text-white"
                : "bg-white text-foreground border border-input hover:bg-accent"
            }`}
          >
            All Courses
          </button>
          <button
            onClick={() => setActiveFilter("in-progress")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeFilter === "in-progress"
                ? "bg-green-600 text-white"
                : "bg-white text-foreground border border-input hover:bg-accent"
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setActiveFilter("completed")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeFilter === "completed"
                ? "bg-green-600 text-white"
                : "bg-white text-foreground border border-input hover:bg-accent"
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">Error loading courses</h3>
          <p className="text-muted-foreground mb-4">
            {error && 'data' in error ? (error.data as any)?.message || 'Failed to load courses' : 'Failed to load courses'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Course Grid */}
      {!isError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Skeleton Loaders (Initial Load or Filter Change) */}
          {/* Show skeleton when filter is changing OR when loading and no courses */}
          {(isFilterChanging || (isLoading && allCourses.length === 0)) && (
            Array.from({ length: 12 }).map((_, index) => (
              <Card key={`skeleton-${index}`} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  {/* Course Icon Skeleton */}
                  <Skeleton className="w-10 h-10 rounded-md mb-3" />
                  
                  {/* Course Title Skeleton */}
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  
                  {/* Instructor Skeleton */}
                  <Skeleton className="h-3 w-1/2 mb-3" />
                  
                  {/* Progress Section Skeleton */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-10" />
                    </div>
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                  
                  {/* Lessons and Status Skeleton */}
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Actual Course Cards - Only show when not changing filters */}
          {!isFilterChanging && allCourses.map((course) => {
            // Convert hex color to Tailwind class or use inline style
            const bgColor = course.color || '#FDB022'
            
            return (
              <Card key={course.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  {/* Course Icon/Thumbnail */}
                  {course.thumbnail ? (
                    <div className="w-10 h-10 rounded-md overflow-hidden mb-3">
                      <img 
                        src={course.thumbnail} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div 
                      className="w-10 h-10 rounded-md flex items-center justify-center mb-3"
                      style={{ backgroundColor: bgColor }}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  )}

                  {/* Course Title */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={course.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-sm mb-1 line-clamp-1 block hover:text-primary hover:underline transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {course.title}
                        </a>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[300px]">
                        <p>{course.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Instructor */}
                  {course.instructor && (
                    <p className="text-xs text-muted-foreground mb-3">{course.instructor}</p>
                  )}

                  {/* Progress Section */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-[#00B140] h-1.5 rounded-full transition-all" 
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Lessons and Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {course.completedLessons}/{course.totalLessons} lessons
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-xs px-2 py-0.5 ${
                        course.status === "completed"
                          ? "bg-[#D4EDDA] text-[#155724] hover:bg-[#D4EDDA]"
                          : "bg-[#CCE5FF] text-[#004085] hover:bg-[#CCE5FF]"
                      }`}
                    >
                      {course.status === "completed" ? "Completed" : "In Progress"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Loading More - Show skeleton cards */}
          {(isLoading || isFetching) && allCourses.length > 0 && !isFilterChanging && (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={`loading-skeleton-${index}`} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  {/* Course Icon Skeleton */}
                  <Skeleton className="w-10 h-10 rounded-md mb-3" />
                  
                  {/* Course Title Skeleton */}
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  
                  {/* Instructor Skeleton */}
                  <Skeleton className="h-3 w-1/2 mb-3" />
                  
                  {/* Progress Section Skeleton */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-10" />
                    </div>
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                  
                  {/* Lessons and Status Skeleton */}
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      {hasMore && !isFetching && !isError && !isFilterChanging && (
        <div ref={observerTarget} className="h-4" />
      )}

      {/* Empty State - Only show when not loading and not changing filters */}
      {!isLoading && !isFetching && !isFilterChanging && !isError && allCourses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No courses found</h3>
          <p className="text-muted-foreground">
            {activeFilter === "completed"
              ? "You haven't completed any courses yet."
              : activeFilter === "in-progress"
              ? "You don't have any courses in progress."
              : "You don't have any enrolled courses yet."}
          </p>
        </div>
      )}
    </div>
  )
}
