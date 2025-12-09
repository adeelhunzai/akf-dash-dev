"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface CertificateData {
  month: string
  sold: number
  revenue: string
}

const cpdCertificates: CertificateData[] = [
  { month: "January", sold: 13, revenue: "$13434" },
  { month: "February", sold: 24, revenue: "$13414" },
  { month: "March", sold: 234, revenue: "$425245" },
  { month: "April", sold: 23, revenue: "$254525" },
  { month: "May", sold: 123, revenue: "$345353" },
]

const otherCertificates: CertificateData[] = [
  { month: "January", sold: 8, revenue: "$8234" },
  { month: "February", sold: 15, revenue: "$9800" },
  { month: "March", sold: 156, revenue: "$312400" },
  { month: "April", sold: 18, revenue: "$156300" },
  { month: "May", sold: 89, revenue: "$267500" },
]

export function RevenueCertificatesTable() {
  const [activeTab, setActiveTab] = useState<"cpd" | "other">("cpd")
  const [searchQuery, setSearchQuery] = useState("")

  const data = activeTab === "cpd" ? cpdCertificates : otherCertificates
  const filteredData = data.filter((item) => item.month.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
      <div>
        <h3 className="mb-6 text-xl font-semibold text-foreground">Revenue & Certificates Sale</h3>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <Button
            onClick={() => setActiveTab("cpd")}
            className={`${
              activeTab === "cpd"
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-transparent text-gray-700 hover:bg-gray-100"
            }`}
          >
            CPD Certificates
          </Button>
          <Button
            onClick={() => setActiveTab("other")}
            className={`${
              activeTab === "other"
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-transparent text-gray-700 hover:bg-gray-100"
            }`}
          >
            Other Certificates
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search by month..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-gray-200"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">MONTHS</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">CERTIFICATES SOLD</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">REVENUE</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-foreground">{row.month}</td>
                  <td className="px-6 py-4 text-sm text-foreground font-medium">{row.sold}</td>
                  <td className="px-6 py-4 text-sm text-foreground font-medium">{row.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">No data found for "{searchQuery}"</div>
        )}
      </div>
    </div>
  )
}
