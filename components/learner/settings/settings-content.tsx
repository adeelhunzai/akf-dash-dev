"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useGetLearnerSettingsQuery, useUpdateLearnerSettingsMutation } from "@/lib/store/api/userApi"

export default function SettingsContent() {
  const { toast } = useToast()
  const { data, isLoading, error } = useGetLearnerSettingsQuery()
  const [updateSettings, { isLoading: isUpdating }] = useUpdateLearnerSettingsMutation()

  // Form state
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [department, setDepartment] = useState("")
  const [preferredLanguage, setPreferredLanguage] = useState("")
  const [learningGoal, setLearningGoal] = useState("")
  const [courseReminders, setCourseReminders] = useState(true)
  const [achievementNotifications, setAchievementNotifications] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(false)

  // Populate form when data loads
  useEffect(() => {
    if (data?.data) {
      const { personal_info, learning_preferences, notifications } = data.data
      setFullName(personal_info.full_name || "")
      setEmail(personal_info.email || "")
      setPhone(personal_info.phone || "")
      setDepartment(personal_info.department || "")
      setPreferredLanguage(learning_preferences.preferred_language || "english")
      setLearningGoal(learning_preferences.learning_goal || "skill")
      setCourseReminders(notifications.course_reminders)
      setAchievementNotifications(notifications.achievement_notifications)
      setWeeklyReport(notifications.weekly_report)
    }
  }, [data])

  const handleSave = async () => {
    try {
      await updateSettings({
        personal_info: {
          full_name: fullName,
          email,
          phone,
          department,
        },
        learning_preferences: {
          preferred_language: preferredLanguage,
          learning_goal: learningGoal,
        },
        notifications: {
          course_reminders: courseReminders,
          achievement_notifications: achievementNotifications,
          weekly_report: weeklyReport,
        },
      }).unwrap()

      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    // Reset to original values
    if (data?.data) {
      const { personal_info, learning_preferences, notifications } = data.data
      setFullName(personal_info.full_name || "")
      setEmail(personal_info.email || "")
      setPhone(personal_info.phone || "")
      setDepartment(personal_info.department || "")
      setPreferredLanguage(learning_preferences.preferred_language || "english")
      setLearningGoal(learning_preferences.learning_goal || "skill")
      setCourseReminders(notifications.course_reminders)
      setAchievementNotifications(notifications.achievement_notifications)
      setWeeklyReport(notifications.weekly_report)
    }
  }

  if (isLoading) {
    return <SettingsLoadingSkeleton />
  }

  if (error) {
    return (
      <div className="p-6 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">Failed to load settings. Please try again later.</p>
        </div>
      </div>
    )
  }

  const availableOptions = data?.data?.available_options

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <h1 className="text-2xl font-bold text-foreground mb-6">Account Setting</h1>

      {/* Personal Information */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="fullName" className="text-sm font-medium mb-2 block">
                Full Name
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-medium mb-2 block">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone" className="text-sm font-medium mb-2 block">
                Phone Number
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="department" className="text-sm font-medium mb-2 block">
                Department
              </Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {availableOptions?.departments.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Preferences */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Learning Preferences</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language" className="text-sm font-medium mb-2 block">
                Preferred Language
              </Label>
              <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {availableOptions?.languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="goal" className="text-sm font-medium mb-2 block">
                Learning Goal
              </Label>
              <Select value={learningGoal} onValueChange={setLearningGoal}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  {availableOptions?.learning_goals.map((goal) => (
                    <SelectItem key={goal.value} value={goal.value}>
                      {goal.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <h3 className="font-medium text-sm mb-1">Course Reminders</h3>
                <p className="text-sm text-muted-foreground">
                  Get notified about upcoming deadlines and new content
                </p>
              </div>
              <Switch
                checked={courseReminders}
                onCheckedChange={setCourseReminders}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <h3 className="font-medium text-sm mb-1">Achievement Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Get notified when you earn badges and certificates
                </p>
              </div>
              <Switch
                checked={achievementNotifications}
                onCheckedChange={setAchievementNotifications}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="font-medium text-sm mb-1">Weekly Progress Report</h3>
                <p className="text-sm text-muted-foreground">
                  Receive weekly summaries of your learning progress
                </p>
              </div>
              <Switch
                checked={weeklyReport}
                onCheckedChange={setWeeklyReport}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" className="px-6" onClick={handleCancel} disabled={isUpdating}>
          Cancel
        </Button>
        <Button 
          className="bg-green-600 hover:bg-green-700 text-white px-6" 
          onClick={handleSave}
          disabled={isUpdating}
        >
          {isUpdating ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}

// Loading Skeleton Component
function SettingsLoadingSkeleton() {
  return (
    <div className="p-6 md:p-8">
      <Skeleton className="h-8 w-48 mb-6" />

      {/* Personal Information Skeleton */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Preferences Skeleton */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <Skeleton className="h-6 w-44 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-4 w-36 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences Skeleton */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons Skeleton */}
      <div className="flex justify-end gap-3">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}
