"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ReportCards } from "./report-cards"
import { CoursesReportTable } from "./courses-report-table"
import { LearnerReportTable } from "./learner-report-table"
import { Download } from "lucide-react"
import { TeamPerformanceTable } from "./team-performance-table"
import { CoursePopularityTable } from "./course-popularity-table"
import { RevenueCertificatesTable } from "./revenue-certificates-table"
import { DemographicBreakdownTable } from "./demographic-breakdown-table"

export function ReportsContent() {
  const [activeTab, setActiveTab] = useState<"courses" | "learner">("courses")
  const [selectedReport, setSelectedReport] = useState("user-enrollment")
  const [dateRange, setDateRange] = useState("0")
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Debounce search query - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header Section */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="mt-2 text-sm text-muted-foreground">Generate and view detailed analytics reports</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 bg-transparent">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Available Reports */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Available Reports</h2>
        <ReportCards selectedReport={selectedReport} onSelectReport={setSelectedReport} />
      </div>

      {/* Report Content */}
      {selectedReport === "user-enrollment" && (
        <div>
          {/* Title and Filters */}
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-foreground">User Enrollment & Completion Report</h3>
            <div className="flex gap-4">
              <div className="flex-grow">
                <Input
                  placeholder="Search..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="border-gray-200 w-64"
                />
              </div>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All time</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-2">
            <Button
              onClick={() => setActiveTab("courses")}
              className={`${
                activeTab === "courses"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Courses Report
            </Button>
            <Button
              onClick={() => setActiveTab("learner")}
              className={`${
                activeTab === "learner"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Learner Report
            </Button>
          </div>

          {/* Table */}
          {activeTab === "courses" && <CoursesReportTable searchQuery={searchQuery} dateRange={dateRange} />}
          {activeTab === "learner" && <LearnerReportTable searchQuery={searchQuery} dateRange={dateRange} />}
        </div>
      )}

      {/* Team Performance Report */}
      {selectedReport === "team-performance" && <TeamPerformanceTable />}

      {/* Course Popularity Report */}
      {selectedReport === "course-popularity" && <CoursePopularityTable />}

      {/* Revenue & Certificates Report */}
      {selectedReport === "revenue-certificates" && <RevenueCertificatesTable />}

      {/* Demographic Breakdown Report */}
      {/* {selectedReport === "demographic" && <DemographicBreakdownTable />} */}
    </div>
  )
}
