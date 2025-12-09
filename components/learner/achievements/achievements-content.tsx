"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Trophy, Check, User, Wrench, Globe, Users, BookOpen, Heart, Zap, Star, Calendar as CalendarIcon } from "lucide-react"

const stats = [
  { label: "Total Badges", value: "12" },
  { label: "This Month", value: "8" },
  { label: "Completion Rate", value: "95%" },
]

const nextGoal = {
  title: "Your next goal!",
  description: "Complete 5 more courses to unlock the Expert badge",
  progress: 3,
  total: 5,
}

const latestGoals = [
  {
    id: 1,
    title: "Veteran",
    description: "Logged in 10 times",
    icon: Check,
    color: "bg-green-600",
    status: "Completed",
  },
  {
    id: 2,
    title: "Rookie",
    description: "First time logged in",
    icon: User,
    color: "bg-blue-600",
    status: "Completed",
  },
]

const wizardBadges = [
  {
    id: 1,
    title: "Seed Wizard",
    description: "Completed 3 courses on Sustainable Food Security",
    icon: Trophy,
    color: "bg-yellow-500",
  },
  {
    id: 2,
    title: "Builder Wizard",
    description: "Completed 3 courses on Community Strengthening",
    icon: Wrench,
    color: "bg-purple-400",
  },
  {
    id: 3,
    title: "Earth Wizard",
    description: "Completed 3 courses on Climate Resilience",
    icon: Globe,
    color: "bg-blue-600",
  },
  {
    id: 4,
    title: "Youth Wizard",
    description: "Completed 3 courses on Early Childhood Development",
    icon: Users,
    color: "bg-cyan-400",
  },
  {
    id: 5,
    title: "Knowledge Wizard",
    description: "Completed 3 courses on Education",
    icon: BookOpen,
    color: "bg-orange-500",
  },
  {
    id: 6,
    title: "Life Wizard",
    description: "Completed 3 courses on Health and Nutrition",
    icon: Heart,
    color: "bg-pink-600",
  },
]

const achievements = [
  {
    id: 1,
    title: "First Course Completed",
    description: "Completed your first course successfully",
    date: "2024-10-22",
    icon: Trophy,
    color: "bg-blue-600",
    category: "Milestone",
    categoryColor: "bg-blue-100 text-blue-700",
  },
  {
    id: 2,
    title: "Quick Learner",
    description: "Completed a course in under 2 weeks",
    date: "2024-11-15",
    icon: Zap,
    color: "bg-cyan-400",
    category: "Speed",
    categoryColor: "bg-cyan-100 text-cyan-700",
  },
  {
    id: 3,
    title: "High Achiever",
    description: "Scored 90% or higher on 3 courses",
    date: "2024-12-08",
    icon: Star,
    color: "bg-orange-500",
    category: "Performance",
    categoryColor: "bg-orange-100 text-orange-700",
  },
  {
    id: 4,
    title: "Consistent Learner",
    description: "Logged in for 30 consecutive days",
    date: "2024-12-01",
    icon: CalendarIcon,
    color: "bg-pink-600",
    category: "Consistency",
    categoryColor: "bg-pink-100 text-pink-700",
  },
]

export default function AchievementsContent() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Achievements</h1>
            <p className="text-sm text-white/90">Keep track of your progress.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-white/80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Goal */}
      <Card className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1">{nextGoal.title}</h3>
                <p className="text-sm text-muted-foreground">{nextGoal.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24">
                <Progress value={(nextGoal.progress / nextGoal.total) * 100} className="h-2" />
              </div>
              <span className="text-lg font-bold text-orange-600">
                {nextGoal.progress}/{nextGoal.total}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Latest Goals */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">My Latest Goals!</h2>
        <div className="space-y-3">
          {latestGoals.map((goal) => {
            const Icon = goal.icon
            return (
              <Card key={goal.id} className={goal.id === 1 ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${goal.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{goal.title}</h3>
                        <p className="text-xs text-muted-foreground">{goal.description}</p>
                      </div>
                    </div>
                    <Badge className={goal.id === 1 ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-blue-100 text-blue-700 hover:bg-blue-100"}>
                      {goal.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Wizard Badges */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Achievements</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {wizardBadges.map((badge) => {
            const Icon = badge.icon
            return (
              <div key={badge.id} className="text-center">
                <div className={`w-20 h-20 ${badge.color} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                  <Icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{badge.title}</h3>
                <p className="text-xs text-muted-foreground leading-tight">{badge.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Achievement Cards */}
      <div>
        <h2 className="text-xl font-bold mb-4">Achievements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {achievements.map((achievement) => {
            const Icon = achievement.icon
            return (
              <Card key={achievement.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 text-center">
                  <div className={`w-16 h-16 ${achievement.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-base mb-2">{achievement.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3 min-h-[2.5rem]">{achievement.description}</p>
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-3">
                    <CalendarIcon className="w-3 h-3" />
                    <span>{achievement.date}</span>
                  </div>
                  <Badge className={achievement.categoryColor}>
                    {achievement.category}
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
