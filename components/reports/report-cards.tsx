"use client"

import type React from "react"
import { Users, Users2, BookOpen, DollarSign, PieChart } from "lucide-react"

interface ReportCard {
  id: string
  title: string
  icon: React.ReactNode
}

const reports: ReportCard[] = [
  {
    id: "user-enrollment",
    title: "Course Reports",
    icon: <Users className="h-6 w-6 text-green-600" />,
  },
  {
    id: "team-performance",
    title: "Team Reports",
    icon: <Users2 className="h-6 w-6" />,
  },
  {
    id: "course-popularity",
    title: "Course Popularity",
    icon: <BookOpen className="h-6 w-6" />,
  },
  {
    id: "revenue-certificates",
    title: "Certificate Sales",
    icon: <DollarSign className="h-6 w-6" />,
  },
  // {
  //   id: "demographic",
  //   title: "Demographic Breakdown",
  //   icon: <PieChart className="h-6 w-6" />,
  // },
]

export function ReportCards({
  selectedReport,
  onSelectReport,
}: {
  selectedReport: string
  onSelectReport: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {reports.map((report) => (
        <button
          key={report.id}
          onClick={() => onSelectReport(report.id)}
          className={`p-4 text-center transition-all ${
            selectedReport === report.id
              ? "border-2 border-green-600 bg-green-50 rounded-lg"
              : "border border-gray-200 bg-white hover:bg-gray-50 rounded-lg"
          }`}
        >
          <div className="mb-3 flex justify-center">
            {selectedReport === report.id ? (
              <span className="text-green-600">{report.icon}</span>
            ) : (
              <span className="text-gray-400">{report.icon}</span>
            )}
          </div>
          <p className={`text-sm font-medium ${selectedReport === report.id ? "text-green-600" : "text-gray-700"}`}>
            {report.title}
          </p>
        </button>
      ))}
    </div>
  )
}
