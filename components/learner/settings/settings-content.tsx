"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function SettingsContent() {
  const [courseReminders, setCourseReminders] = useState(true)
  const [achievementNotifications, setAchievementNotifications] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(false)

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
                defaultValue="Admin User"
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
                defaultValue="admin@akf.org"
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
                defaultValue="+1 (555) 123-4567"
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="department" className="text-sm font-medium mb-2 block">
                Department
              </Label>
              <Select defaultValue="it">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
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
              <Select defaultValue="english">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                  <SelectItem value="german">German</SelectItem>
                  <SelectItem value="chinese">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="goal" className="text-sm font-medium mb-2 block">
                Learning Goal
              </Label>
              <Select defaultValue="skill">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skill">Skill Development</SelectItem>
                  <SelectItem value="career">Career Advancement</SelectItem>
                  <SelectItem value="certification">Certification</SelectItem>
                  <SelectItem value="personal">Personal Growth</SelectItem>
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
        <Button variant="outline" className="px-6">
          Cancel
        </Button>
        <Button className="bg-green-600 hover:bg-green-700 text-white px-6">
          Save Changes
        </Button>
      </div>
    </div>
  )
}
