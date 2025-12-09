"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { UserRoundPlus, Award, Users, FileText, ArrowUpFromLine } from "lucide-react"

interface ActivityItem {
  icon: React.ReactNode
  message: string
  timestamp: string
  bgColor: string
}

const activities: ActivityItem[] = [
  {
    icon: <UserRoundPlus className="w-5 h-5" />,
    message: "New learner Sarah Johnson registered",
    timestamp: "2 minutes ago",
    bgColor: "bg-[#22C55E] text-[#fff]",
  },
  {
    icon: <Award className="w-5 h-5" />,
    message: "Michael Chen completed Python for Beginners",
    timestamp: "15 minutes ago",
    bgColor: "bg-[#EAB308] text-[#FFFFFF]",
  },
  {
    icon: <Users className="w-5 h-5" />,
    message: 'New team "Marketing Team" created by Admin',
    timestamp: "1 hour ago",
    bgColor: "bg-[#3B82F6] text-[#ffffff]",
  },
  {
    icon: <FileText className="w-5 h-5" />,
    message: "Certificate issued to Emily Rodriguez",
    timestamp: "2 hours ago",
    bgColor: "bg-[#A855F7] text-[#ffffff]",
  },
  {
    icon: <ArrowUpFromLine className="w-5 h-5" />,
    message: "25 new users added via CSV upload",
    timestamp: "3 hours ago",
    bgColor: "bg-[#6366F1] text-[#ffffff]",
  },
]

export default function RecentActivity() {
  return (
    <Card className="p-4 md:p-6 h-fit lg:col-span-2">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <p className="text-xs md:text-sm text-muted-foreground mb-4">Latest platform activities</p>
      <div className="space-y-3">
        {activities.map((activity, idx) => (
          <div key={idx} className="flex gap-3 pb-3 border-b border-border last:border-0">
            <div className={`${activity.bgColor} p-2 w-12 h-12 rounded-full aspect-square flex-shrink-0 flex items-center justify-center`}>
              {activity.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm text-foreground line-clamp-2">{activity.message}</p>
              <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
