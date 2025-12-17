"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock, Users, Pause, Sparkles, CheckCircle2, Eye } from "lucide-react"
import { CourseReportItem } from "@/lib/types/reports.types"

interface CourseDetailsModalProps {
  course: CourseReportItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CourseDetailsModal({ course, open, onOpenChange }: CourseDetailsModalProps) {
  if (!course) return null

  const totalEnrolled = course.enrolled
  const notStarted = course.notStarted
  const inProgress = course.inProgress
  const completed = course.completed

  // Calculate percentages
  const notStartedPercent = totalEnrolled > 0 ? ((notStarted / totalEnrolled) * 100).toFixed(1) : "0"
  const inProgressPercent = totalEnrolled > 0 ? ((inProgress / totalEnrolled) * 100).toFixed(1) : "0"
  const completedPercent = totalEnrolled > 0 ? ((completed / totalEnrolled) * 100).toFixed(1) : "0"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="!max-w-[896px] w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] flex flex-col" 
        style={{ 
          maxHeight: '90vh'
        }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">
            Course Details
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">ID: {course.id}</p>
        </DialogHeader>

        <div className="space-y-4 mt-2 flex-1 overflow-y-auto">
          {/* Course Title and Basic Info */}
          <div 
            className="rounded-lg p-4"
            style={{ 
              background: '#F0FDF4' 
            }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-3">{course.name}</h3>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{totalEnrolled.toLocaleString()} enrolled</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Avg: {course.avgTime}</span>
              </div>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Not Started Card */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 relative">
              <div className="absolute top-3 right-3">
                <div className="bg-blue-500 rounded p-1.5">
                  <Pause className="h-3 w-3 text-white" />
                </div>
              </div>
              <p className="text-sm font-medium text-blue-900 mb-2">Not Started</p>
              <p className="text-2xl font-bold text-blue-900 mb-1">{notStarted.toLocaleString()}</p>
              <p className="text-xs text-blue-700">{notStartedPercent}% of total</p>
            </div>

            {/* In Progress Card */}
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 relative">
              <div className="absolute top-3 right-3">
                <div className="bg-yellow-500 rounded p-1.5">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>
              <p className="text-sm font-medium text-yellow-900 mb-2">In Progress</p>
              <p className="text-2xl font-bold text-yellow-900 mb-1">{inProgress.toLocaleString()}</p>
              <p className="text-xs text-yellow-700">{inProgressPercent}% of total</p>
            </div>

            {/* Completed Card */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200 relative">
              <div className="absolute top-3 right-3">
                <div className="bg-green-500 rounded p-1.5">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
              </div>
              <p className="text-sm font-medium text-green-900 mb-2">Completed</p>
              <p className="text-2xl font-bold text-green-900 mb-1">{completed.toLocaleString()}</p>
              <p className="text-xs text-green-700">{completedPercent}% of total</p>
            </div>
          </div>

          {/* Additional Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Average Time Card */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="rounded-lg flex items-center justify-center w-10 h-10 flex-shrink-0" style={{ backgroundColor: '#F3E8FF' }}>
                  <Clock className="h-4 w-4" style={{ color: '#9333EA' }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-normal mb-1" style={{ color: '#6B7280' }}>Average Time</p>
                  <p className="text-xl font-bold text-gray-900">{course.avgTime}</p>
                </div>
              </div>
            </div>

            {/* Total Enrolled Card */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="rounded-lg flex items-center justify-center w-10 h-10 flex-shrink-0" style={{ backgroundColor: '#CFFAFE' }}>
                  <Users className="h-4 w-4" style={{ color: '#0891B2' }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-normal mb-1" style={{ color: '#6B7280' }}>Total Enrolled</p>
                  <p className="text-xl font-bold text-gray-900">{totalEnrolled.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* View Course Button */}
          <div className="flex justify-start pt-4 border-t">
            <Button 
              variant="outline" 
              className="border-gray-200 bg-white hover:bg-gray-50"
              onClick={() => window.open(course.url, '_blank')}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Course
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

