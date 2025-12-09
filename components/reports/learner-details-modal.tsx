"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Monitor, CheckCircle2, Clock } from "lucide-react"
import { LearnerReportItem } from "@/lib/types/reports.types"

interface LearnerDetailsModalProps {
  learner: LearnerReportItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Helper function to get initials from name
function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// Helper function to format time
function formatTime(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.floor((hours - h) * 60)
  return `${h}h ${m}m`
}

export function LearnerDetailsModal({ learner, open, onOpenChange }: LearnerDetailsModalProps) {
  if (!learner) return null

  const initials = getInitials(learner.name)
  const totalTime = learner.totalTimeFormatted || formatTime(learner.totalHours)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="!max-w-[896px] w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] flex flex-col p-0" 
        style={{ 
          maxHeight: '90vh'
        }}
      >
        <DialogHeader 
          className="flex-shrink-0 px-6 pt-6 pb-4"
          style={{ borderBottom: '1px solid #E5E7EB' }}
        >
          <DialogTitle className="text-xl font-semibold">
            Learner Profile
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">ID: {learner.id}</p>
        </DialogHeader>

        <div className="space-y-6 px-6 pt-6 pb-6 flex-1 overflow-y-auto">
          {/* Profile Section */}
          <div 
            className="rounded-lg p-6 flex items-start gap-6"
            style={{ 
              background: 'linear-gradient(to right, #EFF6FF, #EEF2FF)' 
            }}
          >
            {/* Profile Picture with Initials */}
            <div className="flex-shrink-0">
              <div 
                className="rounded-full w-28 h-28 flex items-center justify-center text-white font-bold text-4xl"
                style={{ backgroundColor: '#16a34a' }}
              >
                {initials}
              </div>
            </div>

            {/* Name and Info */}
            <div className="flex-1">
              <h3 className="text-4xl font-bold text-foreground mb-2">{learner.name}</h3>
              <p className="text-base text-muted-foreground">{learner.email}</p>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Enrolled Courses Card */}
            <div 
              className="rounded-lg p-4 border"
              style={{ 
                backgroundColor: '#FAF5FF',
                borderColor: '#F3E8FF'
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-normal" style={{ color: '#581C87' }}>Enrolled</p>
                <Monitor className="h-5 w-5 flex-shrink-0" style={{ color: '#7E22CE' }} />
              </div>
              <p className="text-2xl font-bold mb-1" style={{ color: '#581C87' }}>{learner.coursesEnrolled.toLocaleString()}</p>
              <p className="text-xs font-normal" style={{ color: '#7E22CE' }}>Total courses</p>
            </div>

            {/* Completed Courses Card */}
            <div 
              className="rounded-lg p-4 border"
              style={{ 
                backgroundColor: '#F0FDF4',
                borderColor: '#D1FAE5'
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-normal" style={{ color: '#14532D' }}>Completed</p>
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: '#15803D' }} />
              </div>
              <p className="text-2xl font-bold mb-1" style={{ color: '#14532D' }}>{learner.coursesCompleted.toLocaleString()}</p>
              <p className="text-xs font-normal" style={{ color: '#15803D' }}>Finished courses</p>
            </div>

            {/* Total Time Card */}
            <div 
              className="rounded-lg p-4 border"
              style={{ 
                backgroundColor: '#FFF7ED',
                borderColor: '#FFEDD5'
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-normal" style={{ color: '#7C2D12' }}>Total Time</p>
                <Clock className="h-5 w-5 flex-shrink-0" style={{ color: '#C2410C' }} />
              </div>
              <p className="text-2xl font-bold mb-1" style={{ color: '#7C2D12' }}>{totalTime}</p>
              <p className="text-xs font-normal" style={{ color: '#C2410C' }}>Learning hours</p>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
