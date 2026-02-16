"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGetCertificateSalesQuery } from "@/lib/store/api/reportsApi"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

import { CertificateSalesData } from "@/lib/types/reports.types"

interface CertificateData {
  month: string
  sold: number
}

interface RevenueCertificatesTableProps {
  onVisibleRowsChange?: (context: { rows: CertificateSalesData[]; activeTab: "cpd" | "other" }) => void
  onLoadingChange?: (loading: boolean) => void
}

export function RevenueCertificatesTable({ onVisibleRowsChange, onLoadingChange }: RevenueCertificatesTableProps) {
  const [activeTab, setActiveTab] = useState<"cpd" | "other">("cpd")
  const [monthsBack, setMonthsBack] = useState("24")

  // Convert monthsBack to number
  const monthsBackNum = parseInt(monthsBack) || 24

  // Fetch certificate sales data
  const { data, isLoading, error } = useGetCertificateSalesQuery({ months_back: monthsBackNum })

  // Get data based on active tab
  const rawData = activeTab === "cpd" 
    ? data?.data?.cpd_certificates || []
    : data?.data?.other_certificates || []

  // Use raw data directly (no search filter), reversed so latest is first
  const filteredData = [...rawData].reverse()

  const prevContextRef = useRef<{ rows: CertificateSalesData[]; activeTab: "cpd" | "other" } | null>(null)

  useEffect(() => {
    if (!onVisibleRowsChange) return

    const prevContext = prevContextRef.current
    const rowsAreSame =
      prevContext?.rows.length === filteredData.length &&
      filteredData.every((row, index) => {
        const prevRow = prevContext?.rows[index]
        return prevRow && prevRow.month === row.month && prevRow.sold === row.sold
      })
    const tabIsSame = prevContext?.activeTab === activeTab

    if (rowsAreSame && tabIsSame) return

    const context = { rows: filteredData, activeTab }
    prevContextRef.current = context
    onVisibleRowsChange(context)
  }, [filteredData, activeTab, onVisibleRowsChange])

  useEffect(() => {
    if (!onLoadingChange) return
    onLoadingChange(isLoading)
  }, [isLoading, onLoadingChange])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 rounded-md border border-gray-200 bg-white p-6">
        <div>
          <h3 className="mb-6 text-xl font-semibold text-foreground">Certificates Report</h3>
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
      <div className="space-y-6 rounded-md border border-gray-200 bg-white p-6">
        <div>
          <h3 className="mb-6 text-xl font-semibold text-foreground">Certificates Report</h3>
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
    <div className="space-y-6 rounded-md border border-gray-200 bg-white p-6">
      <div>
        {/* Title and Filters */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">Certificates Report</h3>
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

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-md p-1" style={{ backgroundColor: '#F3F4F6' }}>
          <Button
            onClick={() => setActiveTab("cpd")}
            className={`w-[160px] ${
              activeTab === "cpd"
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-transparent text-gray-700 hover:bg-gray-200"
            }`}
          >
            CPD Certificates
          </Button>
          <Button
            onClick={() => setActiveTab("other")}
            className={`w-[160px] ${
              activeTab === "other"
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-transparent text-gray-700 hover:bg-gray-200"
            }`}
          >
            Other Certificates
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-md border border-gray-200">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: '#F3F4F6' }}>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500">MONTHS</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500">YEAR</th>
                <th className="px-6 py-4 text-right text-xs font-medium uppercase text-gray-500">CERTIFICATES ISSUED</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-foreground">{row.month}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{row.month_key ? row.month_key.split("-")[0] : ""}</td>
                    <td className="px-6 py-4 text-sm text-foreground text-right">{row.sold}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No certificate data available
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
