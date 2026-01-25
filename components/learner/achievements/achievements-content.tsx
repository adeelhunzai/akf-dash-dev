"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy, Check, User, Wrench, Globe, Users, BookOpen, Heart, Zap, Star, Calendar as CalendarIcon, Award, GraduationCap } from "lucide-react"
import type { LucideProps } from "lucide-react"
import { useGetLearnerAchievementsQuery } from "@/lib/store/api/userApi"
import { ComponentType } from "react"

// Icon component type
type IconComponent = ComponentType<LucideProps>

// Map icon strings from API to Lucide components
const iconMap: Record<string, IconComponent> = {
  Trophy,
  Check,
  User,
  Wrench,
  Globe,
  Users,
  BookOpen,
  Heart,
  Zap,
  Star,
  Calendar: CalendarIcon,
  Award,
  GraduationCap,
}

// Get icon component from string name
const getIcon = (iconName: string): IconComponent => {
  return iconMap[iconName] || Trophy
}

export default function AchievementsContent() {
  const { data, isLoading, error } = useGetLearnerAchievementsQuery()

  const allStats = data?.data?.stats || []
  // Filter out "This Month" and "Completion Rate" stats
  const stats = allStats.filter((stat: { label: string }) => 
    !stat.label.toLowerCase().includes('this month') && 
    !stat.label.toLowerCase().includes('completion rate')
  )
  const nextGoal = data?.data?.next_goal || { title: "", description: "", progress: 0, total: 1 }
  const latestGoals = data?.data?.latest_goals || []
  const wizardBadges = data?.data?.wizard_badges || []
  const achievements = data?.data?.achievements || []

  if (isLoading) {
    return <AchievementsLoadingSkeleton />
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">Failed to load achievements. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Hero Section with Goals */}
      <div className="bg-[#1275db] rounded-2xl p-8 mb-6">
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
        {stats.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {stats.map((stat: { value: string | number; label: string }, index: number) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Next Goal - Inside Blue Container */}
        {nextGoal.title && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1 text-white">Your Next Goal</h3>
                  <p className="text-sm text-white/80">{nextGoal.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24">
                  <Progress value={(nextGoal.progress / nextGoal.total) * 100} className="h-2 bg-white/20 [&>*]:bg-yellow-300" />
                </div>
                <span className="text-lg font-bold text-yellow-300">
                  {nextGoal.progress}/{nextGoal.total}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Latest Goals - Inside Blue Container */}
        {latestGoals.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3 text-white">My Latest Goals!</h2>
            <div className="space-y-3">
              {latestGoals.map((goal, index) => {
                const Icon = getIcon(goal.icon)
                return (
                  <div key={goal.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${goal.color} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-white">{goal.title}</h3>
                          <p className="text-xs text-white/70">{goal.description}</p>
                        </div>
                      </div>
                      <Badge className={index === 0 ? "bg-green-500/80 text-white hover:bg-green-500/80" : "bg-blue-300/50 text-white hover:bg-blue-300/50"}>
                        {goal.status}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Wizard Badges */}
      {wizardBadges.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Wizard Badges</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {wizardBadges.map((badge) => {
              const Icon = getIcon(badge.icon)
              return (
                <div key={badge.id} className={`text-center ${!badge.unlocked ? 'opacity-50' : ''}`}>
                  <div className={`w-20 h-20 ${badge.color} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg relative`}>
                    <Icon className="w-10 h-10 text-white" />
                    {badge.unlocked && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{badge.title}</h3>
                  <p className="text-xs text-muted-foreground leading-tight">{badge.description}</p>
                  {!badge.unlocked && (
                    <p className="text-xs text-orange-600 mt-1">{badge.progress}/{badge.required} courses</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Achievement Cards */}
      {achievements.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((achievement) => {
              const Icon = getIcon(achievement.icon)
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
      )}

      {/* Empty State */}
      {achievements.length === 0 && latestGoals.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No achievements yet</h3>
          <p className="text-sm text-muted-foreground">Complete courses to earn badges and achievements!</p>
        </div>
      )}
    </div>
  )
}

// Loading Skeleton Component
function AchievementsLoadingSkeleton() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Hero Section Skeleton */}
      <div className="bg-[#1275db] rounded-2xl p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-12 h-12 rounded-xl bg-white/20" />
          <div>
            <Skeleton className="h-7 w-40 bg-white/20 mb-2" />
            <Skeleton className="h-4 w-48 bg-white/20" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <Skeleton className="h-9 w-16 mx-auto mb-2 bg-white/20" />
              <Skeleton className="h-4 w-20 mx-auto bg-white/20" />
            </div>
          ))}
        </div>
      </div>

      {/* Next Goal Skeleton */}
      <Card className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="w-24 h-2 bg-white/20" />
              <Skeleton className="h-6 w-10" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Latest Goals Skeleton */}
      <div className="mb-6">
        <Skeleton className="h-7 w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Wizard Badges Skeleton */}
      <div className="mb-6">
        <Skeleton className="h-7 w-36 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="w-20 h-20 rounded-2xl mx-auto mb-3" />
              <Skeleton className="h-4 w-24 mx-auto mb-2" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Cards Skeleton */}
      <div>
        <Skeleton className="h-7 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-5 text-center">
                <Skeleton className="w-16 h-16 rounded-2xl mx-auto mb-4" />
                <Skeleton className="h-5 w-32 mx-auto mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-3/4 mx-auto mb-3" />
                <Skeleton className="h-3 w-20 mx-auto mb-3" />
                <Skeleton className="h-6 w-24 mx-auto rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
