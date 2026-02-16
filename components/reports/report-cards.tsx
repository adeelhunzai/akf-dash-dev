"use client"

import type React from "react"
import { Users } from "lucide-react"

interface ReportCard {
  id: string
  title: string
  icon: React.ReactNode
}

const reports: ReportCard[] = [
  {
    id: "all-reports",
    title: "All Reports",
    icon: <Users className="h-5 w-5" />,
  },
]

export function ReportCards({
  selectedReport,
  onSelectReport,
}: {
  selectedReport: string
  onSelectReport: (id: string) => void
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {reports.map((report) => (
        <button
          key={report.id}
          onClick={() => onSelectReport(report.id)}
          className={`w-full sm:w-[240px] py-4 px-3 text-center transition-all rounded-lg ${
            selectedReport === report.id
              ? "border-2 border-green-600 bg-green-50"
              : "border border-gray-200 bg-white hover:bg-gray-50"
          }`}
        >
          <div className="mb-2 flex justify-center">
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
