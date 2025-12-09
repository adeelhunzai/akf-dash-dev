"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Users,
  Award,
  CircleDollarSign,
  CircleCheck,
  CirclePlay,
  User,
  Trophy,
  CheckCircle,
} from "lucide-react";
import UserDistributionChart from "@/components/charts/user-distribution-chart";

const stats = [
  {
    label: "Total Courses Assigned",
    value: "12",
    change: "+2 this month",
    changeColor: "text-green-600",
    icon: BookOpen,
    iconBg: "bg-[#00B140]",
  },
  {
    label: "Active Courses",
    value: "8",
    change: "+1 this week",
    changeColor: "text-green-600",
    icon: CirclePlay,
    iconBg: "bg-[#FDC300]",
  },
  {
    label: "Learners Enrolled",
    value: "245",
    change: "+18 this week",
    changeColor: "text-green-600",
    icon: Users,
    iconBg: "bg-[#C4A2EA]",
  },
  {
    label: "Facilitator Revenue",
    value: "$15,420",
    change: "+12% this month",
    changeColor: "text-green-600",
    icon: CircleDollarSign,
    iconBg: "bg-blue-500",
  },
  {
    label: "Certificates Issued",
    value: "90",
    change: "+5 this week",
    changeColor: "text-green-600",
    icon: Award,
    iconBg: "bg-cyan-400",
  },
  {
    label: "Course Completion Rate",
    value: "75%",
    change: "+3% this month",
    changeColor: "text-green-600",
    icon: CircleCheck,
    iconBg: "bg-orange-500",
  },
];

const completionData = {
  completed: { value: 4, total: 4, percentage: 33, color: "text-green-600" },
  inProgress: { value: 8, total: 8, percentage: 67, color: "text-yellow-600" },
};

const popularCourses = [
  { name: "Advanced JavaScript", enrolled: 45, color: "#FDC300" },
  { name: "React Development", enrolled: 38, color: "#2563EB" },
  { name: "Node.js Fundamenta", enrolled: 32, color: "#00B140" },
];

const learnerProgress = [
  { status: "Active", count: 89, percentage: 45, color: "#00B140" },
  { status: "Completed", count: 160, percentage: 60, color: "#2563EB" },
  { status: "Pending", count: 5, percentage: 5, color: "#C4A2EA" },
];

const recentActivities = [
  {
    id: 1,
    user: "Sarah Johnson",
    action: "enrolled in React Development",
    time: "2 hours ago",
    icon: User,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: 2,
    user: "Mike Chen",
    action: "Certificate issued to Mike Chen for JavaScript Basics",
    time: "4 hours ago",
    icon: Trophy,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
  {
    id: 3,
    user: "Emma Davis",
    action: "completed Node.js Fundamentals",
    time: "6 hours ago",
    icon: CheckCircle,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    id: 4,
    user: "Alex Rodriguez",
    action: "enrolled in Advanced JavaScript",
    time: "8 hours ago",
    icon: User,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
];

export default function FacilitatorDashboardContent() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Dashboard Overview
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Monitor your platform performance and key metrics
          </p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold mb-1">{stat.value}</p>
                    <p className={`text-xs ${stat.changeColor}`}>
                      {stat.change}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-lg ${stat.iconBg} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Course Completion Rate */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-1">
              Course Completion Rate
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Completed vs In Progress
            </p>
            <div className="flex items-center justify-between gap-6">
              {/* Left side - Circular progress indicators */}
              <div className="flex items-center gap-6">
                {/* Completed Circle */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        className="text-gray-200"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${
                          2 * Math.PI * 36 * (1 - 33 / 100)
                        }`}
                        className="text-[#00B140]"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold leading-none">04</span>
                      <span className="text-xs text-muted-foreground mt-0.5">Total</span>
                    </div>
                  </div>
                </div>

                {/* In Progress Circle */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        className="text-gray-200"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${
                          2 * Math.PI * 36 * (1 - 67 / 100)
                        }`}
                        className="text-[#FDC300]"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold leading-none">08</span>
                      <span className="text-xs text-muted-foreground mt-0.5">Total</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Legend */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00B140] flex-shrink-0"></div>
                  <div className="text-sm">
                    <span className="font-medium">Completed</span>
                    <br />
                    <span className="text-muted-foreground">4 (33%)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FDC300] flex-shrink-0"></div>
                  <div className="text-sm">
                    <span className="font-medium">In Progress</span>
                    <br />
                    <span className="text-muted-foreground">8 (67%)</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top 3 Popular Courses */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-1">
              Top 3 Most Popular Courses
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              see popular courses
            </p>
            <div className="space-y-5">
              {popularCourses.map((course, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {course.name}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {course.enrolled}
                    </span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(course.enrolled / 50) * 100}%`,
                        backgroundColor: course.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1 mt-5">
              <span className="text-muted-foreground text-xs">ⓘ</span>
              <p className="text-xs text-muted-foreground">
                Based on enrollment numbers
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Learner Progress */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-1">Learner Progress</h2>
            <p className="text-sm text-muted-foreground mb-6">See progress</p>
            <div className="flex items-start justify-center gap-8">
              {learnerProgress.map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="relative w-24 h-24 mb-4">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        className="text-gray-200"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        stroke={item.color}
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 38}`}
                        strokeDashoffset={`${
                          2 * Math.PI * 38 * (1 - item.percentage / 100)
                        }`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{item.count}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm font-medium">{item.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.count} ({item.percentage < 10 ? `0${item.percentage}` : item.percentage}%)
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Learners Distribution */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Global Learners Distribution
            </h2>
            <UserDistributionChart />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <Button
                variant="link"
                className="text-green-600 hover:text-green-700 p-0 h-auto"
              >
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-full ${activity.iconBg} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`w-4 h-4 ${activity.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span>{" "}
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
