"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
import { CourseReportItem, LearnerReportItem } from "@/lib/types/reports.types"
import { Document, Page, Text, View, StyleSheet, Font, pdf } from "@react-pdf/renderer"

Font.register({ family: "DejaVuSans", src: "/fonts/DejaVuSans.ttf" })
Font.register({ family: "NotoSansArabic", src: "/fonts/NotoSansArabic-Regular.ttf" })
Font.register({ family: "NotoSans", src: "/fonts/NotoSans-Regular.ttf" })

export function ReportsContent() {
  const [activeTab, setActiveTab] = useState<"courses" | "learner">("courses")
  const [selectedReport, setSelectedReport] = useState("user-enrollment")
  const [dateRange, setDateRange] = useState("0")
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [visibleCourses, setVisibleCourses] = useState<CourseReportItem[]>([])
  const [visibleLearners, setVisibleLearners] = useState<LearnerReportItem[]>([])
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const handleVisibleCoursesChange = useCallback((rows: CourseReportItem[]) => {
    setVisibleCourses((prev) => {
      if (
        prev.length === rows.length &&
        rows.every((course, index) => course.id === prev[index]?.id)
      ) {
        return prev
      }
      return rows
    })
  }, [])

  const handleVisibleLearnersChange = useCallback((rows: LearnerReportItem[]) => {
    setVisibleLearners((prev) => {
      if (
        prev.length === rows.length &&
        rows.every((learner, index) => learner.id === prev[index]?.id)
      ) {
        return prev
      }
      return rows
    })
  }, [])

  const escapeCell = (cell: string) => `"${cell.replace(/"/g, '""')}"`

  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    if (rows.length === 0) return

    const csvContent = "\uFEFF" + [headers, ...rows]
      .map((row) => row.map((cell) => escapeCell(cell)).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportExcel = () => {
    if (activeTab === "courses") {
      const headers = [
        "Course ID",
        "Course Name",
        "Enrolled",
        "Not Started",
        "In Progress",
        "Completed",
        "Completion Rate",
        "Quiz Score",
        "Avg Time",
      ]
      const rows = visibleCourses.map((course) => [
        course.id,
        course.name,
        course.enrolled.toString(),
        course.notStarted.toString(),
        course.inProgress.toString(),
        course.completed.toString(),
        course.completionRate,
        course.quizScore,
        course.avgTime,
      ])
      downloadCSV(`courses-report-${new Date().toISOString().split("T")[0]}.csv`, headers, rows)
      return
    }

    const headers = [
      "Learner ID",
      "Name",
      "Email",
      "Courses Enrolled",
      "Courses Completed",
      "Total Hours",
      "Average Score",
    ]
    const rows = visibleLearners.map((learner) => [
      learner.id,
      learner.name,
      learner.email,
      learner.coursesEnrolled.toString(),
      learner.coursesCompleted.toString(),
      `${learner.totalHours}h`,
      learner.averageScore,
    ])
    downloadCSV(`learners-report-${new Date().toISOString().split("T")[0]}.csv`, headers, rows)
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  const hasNonLatinChars = (text: string): boolean => {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\u0900-\u097F\u0E00-\u0E7F\u0590-\u05FF]/.test(text)
  }

  const hasArabicChars = (text: string): boolean => {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text)
  }

  const hasHindiChars = (text: string): boolean => {
    return /[\u0900-\u097F]/.test(text)
  }

  const tableStyles = StyleSheet.create({
    page: {
      padding: 18,
      fontSize: 9,
      fontFamily: "DejaVuSans",
    },
    title: {
      fontSize: 14,
      marginBottom: 8,
      fontWeight: "bold",
    },
    table: {
      width: "100%",
      borderWidth: 1,
      borderColor: "#cccccc",
      borderStyle: "solid",
    },
    tableRow: {
      flexDirection: "row",
    },
    tableHeader: {
      backgroundColor: "#047c2d",
      color: "#fff",
      padding: 6,
      borderStyle: "solid",
      borderWidth: 1,
      borderColor: "#ccc",
      flexGrow: 1,
      textAlign: "center",
    },
    tableCell: {
      padding: 6,
      borderStyle: "solid",
      borderWidth: 1,
      borderColor: "#ccc",
      flexGrow: 1,
    },
  })

  const columnWidths = activeTab === "courses"
    ? [0.12, 0.34, 0.08, 0.08, 0.08, 0.08, 0.08, 0.12, 0.10]
    : [0.12, 0.26, 0.20, 0.10, 0.10, 0.10, 0.12]

  const getFontFamily = (text: string) => {
    if (hasHindiChars(text)) return "NotoSans"
    if (hasArabicChars(text)) return "NotoSansArabic"
    if (hasNonLatinChars(text)) return "DejaVuSans"
    return "DejaVuSans"
  }

  const exportPDF = async () => {
    if (isExportingPDF) return

    setIsExportingPDF(true)

    try {
      const headers =
        activeTab === "courses"
          ? [
              "Course ID",
              "Course Name",
              "Enrolled",
              "Not Started",
              "In Progress",
              "Completed",
              "Completion Rate",
              "Quiz Score",
              "Avg Time",
            ]
          : [
              "Learner ID",
              "Name",
              "Email",
              "Courses Enrolled",
              "Courses Completed",
              "Total Hours",
              "Average Score",
            ]

      const rows =
        activeTab === "courses"
          ? visibleCourses.map((course) => [
              course.id,
              course.name,
              course.enrolled.toString(),
              course.notStarted.toString(),
              course.inProgress.toString(),
              course.completed.toString(),
              course.completionRate,
              course.quizScore,
              course.avgTime,
            ])
          : visibleLearners.map((learner) => [
              learner.id,
              learner.name,
              learner.email,
              learner.coursesEnrolled.toString(),
              learner.coursesCompleted.toString(),
              `${learner.totalHours}h`,
              learner.averageScore,
            ])

      if (rows.length === 0) {
        alert("No data to export")
        setIsExportingPDF(false)
        return
      }

      const allText = [...headers, ...rows.flat()].join(" ")
      const needsHindi = hasHindiChars(allText)
      const needsArabic = !needsHindi && hasArabicChars(allText)
      const fontFamily = needsHindi ? "NotoSans" : needsArabic ? "NotoSansArabic" : "DejaVuSans"

      const pdfDoc = (
        <Document>
          <Page size="A4" style={tableStyles.page} wrap>
            <Text style={tableStyles.title}>
              Exported {activeTab === "courses" ? "Courses" : "Learners"} Report
            </Text>
            <View style={tableStyles.table}>
              <View style={tableStyles.tableRow}>
                {headers.map((header, index) => (
                  <Text
                    key={header}
                    style={[
                      tableStyles.tableHeader,
                      { fontFamily, width: `${(columnWidths[index] * 100).toFixed(2)}%` },
                    ]}
                  >
                    {header}
                  </Text>
                ))}
              </View>
              {rows.map((row, rowIndex) => (
                <View key={rowIndex} style={tableStyles.tableRow}>
                  {row.map((cell, cellIndex) => (
                    <Text
                      key={`${rowIndex}-${cellIndex}`}
                      style={[
                        tableStyles.tableCell,
                        { fontFamily: getFontFamily(cell.toString()), width: `${(columnWidths[cellIndex] * 100).toFixed(2)}%`, textAlign: cellIndex > 1 ? "right" : "left" },
                      ]}
                    >
                      {cell}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </Page>
        </Document>
      )

      const blob = await pdf(pdfDoc).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `${activeTab === "courses" ? "courses-report" : "learners-report"}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log("✅ PDF exported successfully")
    } catch (error) {
      console.error("❌ PDF export error:", error)
      alert("Failed to export PDF. Please try again or check the console for details.")
    } finally {
      setIsExportingPDF(false)
    }
  }

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
          <Button
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50 bg-transparent"
            onClick={exportPDF}
            disabled={isExportingPDF}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExportingPDF ? "Exporting..." : "Export PDF"}
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={exportExcel}
            disabled={isExportingPDF}
          >
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
          {activeTab === "courses" && (
            <CoursesReportTable
              searchQuery={searchQuery}
              dateRange={dateRange}
              onVisibleRowsChange={handleVisibleCoursesChange}
            />
          )}
          {activeTab === "learner" && (
            <LearnerReportTable
              searchQuery={searchQuery}
              dateRange={dateRange}
              onVisibleRowsChange={handleVisibleLearnersChange}
            />
          )}
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
