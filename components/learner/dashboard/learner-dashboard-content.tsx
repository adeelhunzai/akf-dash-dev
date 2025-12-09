"use client"

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

// Mock data for courses
const currentCourses = [
  {
    id: 1,
    title: "Основы Python для начинающих",
    progress: 75,
    image: "📚",
    color: "bg-blue-100"
  },
  {
    id: 2,
    title: "مقدمة في علوم البيانات",
    progress: 45,
    image: "📊",
    color: "bg-cyan-100"
  },
  {
    id: 3,
    title: "Web Development Fundamentals",
    progress: 20,
    image: "💻",
    color: "bg-indigo-100"
  },
  {
    id: 4,
    title: "ડેટા વિશ્લેષણ કેવી રીતે કરવું",
    progress: 60,
    image: "📈",
    color: "bg-purple-100"
  },
  {
    id: 5,
    title: "Machine Learning Basics",
    progress: 85,
    image: "🤖",
    color: "bg-pink-100"
  },
]

const achievements = [
  {
    id: 1,
    title: "First Course Completed",
    description: "Completed your first course successfully",
    date: "2024-10-22",
    icon: Trophy,
    color: "bg-[#FDB022]"
  },
  {
    id: 2,
    title: "Quick Learner",
    description: "Completed a course in under 2 weeks",
    date: "2024-11-15",
    icon: Zap,
    color: "bg-[#E91E63]"
  },
  {
    id: 3,
    title: "High Achiever",
    description: "Scored 90% or higher on 3 courses",
    date: "2024-12-08",
    icon: Star,
    color: "bg-[#FF6B6B]"
  },
]

export default function LearnerDashboardContent() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Learner Overview</h1>
          <p className="mt-2 text-sm text-muted-foreground">Monitor your platform performance and key metrics</p>
        </div>
        <Select defaultValue="1year">
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1year">1 Year</SelectItem>
            <SelectItem value="6months">6 Months</SelectItem>
            <SelectItem value="3months">3 Months</SelectItem>
            <SelectItem value="1month">1 Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Enrolled Courses</p>
                <p className="text-3xl font-bold">04</p>
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
                <p className="text-3xl font-bold">02</p>
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
                <p className="text-sm text-muted-foreground mb-1">Certificate</p>
                <p className="text-3xl font-bold">03</p>
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
                <p className="text-3xl font-bold">142H</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Progress */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-6">Current Progress</h2>
            <div className="space-y-6">
              {currentCourses.map((course) => (
                <div key={course.id} className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-lg ${course.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                    {course.image}
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
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-6">Recent Achievements</h2>
            <div className="space-y-4">
              {achievements.map((achievement) => {
                const Icon = achievement.icon
                return (
                  <div key={achievement.id} className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-lg ${achievement.color} flex items-center justify-center flex-shrink-0`}>
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
