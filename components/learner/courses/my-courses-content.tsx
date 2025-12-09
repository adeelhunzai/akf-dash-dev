"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Laptop, TrendingUp, Brain } from "lucide-react"

type CourseStatus = "all" | "in-progress" | "completed"

interface Course {
  id: number
  title: string
  instructor: string
  progress: number
  totalLessons: number
  completedLessons: number
  status: "completed" | "in-progress"
  color: string
  icon: any
}

const courses: Course[] = [
  {
    id: 1,
    title: "Digital Marketing Mastery",
    instructor: "Michael Chen",
    progress: 100,
    totalLessons: 16,
    completedLessons: 16,
    status: "completed",
    color: "bg-[#FDB022]",
    icon: BookOpen
  },
  {
    id: 2,
    title: "مقدمة في علوم البيانات",
    instructor: "Emily Rodriguez",
    progress: 45,
    totalLessons: 20,
    completedLessons: 9,
    status: "in-progress",
    color: "bg-[#00BCD4]",
    icon: Laptop
  },
  {
    id: 3,
    title: "ડેટા વિશ્લેષણ કેવી રીતે કરવું",
    instructor: "Priya Patel",
    progress: 60,
    totalLessons: 22,
    completedLessons: 13,
    status: "in-progress",
    color: "bg-[#FF6B6B]",
    icon: TrendingUp
  },
  {
    id: 4,
    title: "Machine Learning Basics",
    instructor: "Dr. Alex Thompson",
    progress: 85,
    totalLessons: 28,
    completedLessons: 24,
    status: "in-progress",
    color: "bg-[#C2185B]",
    icon: Brain
  },
]

export default function MyCoursesContent() {
  const [activeFilter, setActiveFilter] = useState<CourseStatus>("all")

  const filteredCourses = courses.filter((course) => {
    if (activeFilter === "all") return true
    if (activeFilter === "completed") return course.status === "completed"
    if (activeFilter === "in-progress") return course.status === "in-progress"
    return true
  })

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

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCourses.map((course) => {
          const Icon = course.icon
          return (
            <Card key={course.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                {/* Course Icon */}
                <div className={`w-10 h-10 rounded-md ${course.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>

                {/* Course Title */}
                <h3 className="font-semibold text-sm mb-1 line-clamp-1">
                  {course.title}
                </h3>

                {/* Instructor */}
                <p className="text-xs text-muted-foreground mb-3">{course.instructor}</p>

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
      </div>

      {/* Empty State */}
      {filteredCourses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No courses found</h3>
          <p className="text-muted-foreground">
            {activeFilter === "completed"
              ? "You haven't completed any courses yet."
              : "You don't have any courses in progress."}
          </p>
        </div>
      )}
    </div>
  )
}
