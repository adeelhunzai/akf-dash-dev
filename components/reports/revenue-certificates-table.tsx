"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGetCertificateSalesQuery } from "@/lib/store/api/reportsApi"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface CertificateData {
  month: string
  sold: number
}

export function RevenueCertificatesTable() {
  const [activeTab, setActiveTab] = useState<"cpd" | "other">("cpd")
  const [searchQuery, setSearchQuery] = useState("")
  const [monthsBack, setMonthsBack] = useState("24")

  // Convert monthsBack to number
  const monthsBackNum = parseInt(monthsBack) || 24

  // Fetch certificate sales data
  const { data, isLoading, error } = useGetCertificateSalesQuery({ months_back: monthsBackNum })

  // Get data based on active tab
  const rawData = activeTab === "cpd" 
    ? data?.data?.cpd_certificates || []
    : data?.data?.other_certificates || []

  // Filter data based on search query
  const filteredData = rawData.filter((item) => 
    item.month.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
        <div>
          <h3 className="mb-6 text-xl font-semibold text-foreground">Certificates Sale</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
        <div>
          <h3 className="mb-6 text-xl font-semibold text-foreground">Certificates Sale</h3>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load certificate sales data. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
      <div>
        {/* Title and Filters */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">Certificates Sale</h3>
          <div className="flex gap-4">
            <div className="flex-grow">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-gray-200 w-64"
              />
            </div>
            <Select value={monthsBack} onValueChange={setMonthsBack}>
              <SelectTrigger className="w-40 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last 12 months</SelectItem>
                <SelectItem value="24">Last 24 months</SelectItem>
                <SelectItem value="36">Last 36 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg h-10 items-center" style={{ backgroundColor: '#F3F4F6', padding: '2px' }}>
          <Button
            onClick={() => setActiveTab("cpd")}
            className={`${
              activeTab === "cpd"
                ? "bg-green-600 text-white hover:bg-green-700"
                : "text-gray-700 hover:bg-transparent"
            } rounded-md transition-colors h-full px-4`}
            style={activeTab !== "cpd" ? { backgroundColor: '#F3F4F6' } : {}}
          >
            CPD Certificates
          </Button>
          <Button
            onClick={() => setActiveTab("other")}
            className={`${
              activeTab === "other"
                ? "bg-green-600 text-white hover:bg-green-700"
                : "text-gray-700 hover:bg-transparent"
            } rounded-md transition-colors h-full px-4`}
            style={activeTab !== "other" ? { backgroundColor: '#F3F4F6' } : {}}
          >
            Other Certificates
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200" style={{ backgroundColor: '#F9FAFB' }}>
                <th className="px-6 py-4 text-left text-sm font-semibold rounded-tl-lg" style={{ color: '#6B7280' }}>MONTHS</th>
                <th className="px-6 py-4 text-right text-sm font-semibold rounded-tr-lg" style={{ color: '#6B7280' }}>CERTIFICATES ISSUED</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-foreground">{row.month}</td>
                    <td className="px-6 py-4 text-sm text-foreground font-medium text-right">{row.sold}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    {searchQuery 
                      ? `No data found for "${searchQuery}"`
                      : "No certificate data available"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        {data?.data?.totals && (
          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Total CPD Issued</p>
                <p className="text-lg font-semibold text-foreground">{data.data.totals.total_cpd_issued}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Other Issued</p>
                <p className="text-lg font-semibold text-foreground">{data.data.totals.total_other_issued}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Certificates</p>
                <p className="text-lg font-semibold text-foreground">{data.data.totals.total_certificates_issued}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
