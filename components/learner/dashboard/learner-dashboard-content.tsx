"use client"

import { useState } from "react"
import { BookOpen, Award, Clock, GraduationCap, Trophy, Zap, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useGetLearnerDashboardQuery } from "@/lib/store/api/userApi"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"

// Map achievement types to icons and colors
const getAchievementIcon = (type: string) => {
  switch (type) {
    case 'first_completion':
      return Trophy
    case 'quick_learner':
      return Zap
    case 'high_achiever':
      return Star
    default:
      return Trophy
  }
}

const getAchievementColor = (type: string) => {
  switch (type) {
    case 'first_completion':
      return "bg-[#FDB022]"
    case 'quick_learner':
      return "bg-[#E91E63]"
    case 'high_achiever':
      return "bg-[#FF6B6B]"
    default:
      return "bg-[#FDB022]"
  }
}

export default function LearnerDashboardContent() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all")
  
  // Map frontend period to API period format
  const getPeriodParam = (period: string): string | undefined => {
    const periodMap: Record<string, string> = {
      "1month": "1month",
      "3months": "3months",
      "6months": "6months",
      "1year": "1year",
      "all": "all",
    }
    return periodMap[period] || undefined
  }
  
  const periodParam = getPeriodParam(selectedPeriod)
  const { data: dashboardData, isLoading, isError } = useGetLearnerDashboardQuery(periodParam, {
    // Prevent refetch on window focus or reconnect if data is already available
    refetchOnFocus: false,
    refetchOnReconnect: false,
    // Don't automatically refetch when arguments change - use cached data if available
    // This ensures we use cached data when switching between periods or revisiting the dashboard
    refetchOnMountOrArgChange: false,
  })
  
  const summary = dashboardData?.data?.summary
  const currentProgress = dashboardData?.data?.current_progress || []
  const achievements = dashboardData?.data?.achievements || []
  
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Learner Overview</h1>
          <p className="mt-2 text-sm text-muted-foreground">Monitor your platform performance and key metrics</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="1year">1 Year</SelectItem>
            <SelectItem value="6months">6 Months</SelectItem>
            <SelectItem value="3months">3 Months</SelectItem>
            <SelectItem value="1month">1 Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx}>
              <CardContent className="p-6">
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Enrolled Courses</p>
                    <p className="text-3xl font-bold">{summary?.courses_enrolled ?? 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Completed</p>
                    <p className="text-3xl font-bold">{summary?.courses_completed ?? 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-yellow-500 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Certificates</p>
                    <p className="text-3xl font-bold">{summary?.certificates ?? 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Learning Time</p>
                    <p className="text-3xl font-bold">{summary?.learning_time ?? "0H"}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Progress */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-6">Current Progress</h2>
            {isLoading ? (
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <Skeleton className="w-16 h-16 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : currentProgress.length > 0 ? (
              <div className="space-y-6">
                {currentProgress.map((course) => (
                  <div key={course.id} className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {course.thumbnail ? (
                        <Image 
                          src={course.thumbnail} 
                          alt={course.title}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm mb-2 truncate">{course.title}</h3>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[#00B140] h-2 rounded-full transition-all" 
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">{course.progress}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No courses in progress</p>
            )}
          </CardContent>
        </Card>

        {/* My Badges */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-6">My Badges</h2>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-full mb-1" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : achievements.length > 0 ? (
              <div className="space-y-4">
                {achievements.map((achievement) => {
                  const Icon = getAchievementIcon(achievement.type)
                  const color = getAchievementColor(achievement.type)
                  return (
                    <div key={achievement.id} className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm mb-1">{achievement.title}</h3>
                        <p className="text-xs text-muted-foreground mb-1">{achievement.description}</p>
                        <p className="text-xs text-muted-foreground">{achievement.date}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No achievements yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
