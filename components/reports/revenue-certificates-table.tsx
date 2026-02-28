"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
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
  searchQuery?: string
  monthsBack?: number
  startDate?: string
  endDate?: string
  onVisibleRowsChange?: (context: { rows: CertificateSalesData[]; activeTab: "cpd" | "other" }) => void
  onLoadingChange?: (loading: boolean) => void
}

export function RevenueCertificatesTable({ searchQuery = "", monthsBack = 24, startDate, endDate, onVisibleRowsChange, onLoadingChange }: RevenueCertificatesTableProps) {
  const [activeTab, setActiveTab] = useState<"cpd" | "other">("cpd")
  const t = useTranslations("reports.revenueCertificatesTable")

  // Fetch certificate sales data
  const { data, isLoading, error } = useGetCertificateSalesQuery({ 
    months_back: monthsBack,
    start_date: startDate,
    end_date: endDate
  })

  // Get data based on active tab
  const rawData = activeTab === "cpd" 
    ? data?.data?.cpd_certificates || []
    : data?.data?.other_certificates || []

  // Sort so latest is first, then apply search if exists
  const reversedData = [...rawData].reverse()

  const filteredData = reversedData.filter((row) => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    const monthLower = row.month.toLowerCase()
    const yearStr = row.month_key ? row.month_key.split("-")[0] : ""
    const soldStr = row.sold.toString()
    
    return monthLower.includes(searchLower) || yearStr.includes(searchLower) || soldStr.includes(searchLower)
  })

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

  if (isLoading) {
    return (
      <div className="space-y-6 rounded-md border border-gray-200 bg-white p-6">
        <div>
          <h3 className="mb-6 text-xl font-semibold text-foreground">{t("title")}</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 rounded-md border border-gray-200 bg-white p-6">
        <div>
          <h3 className="mb-6 text-xl font-semibold text-foreground">{t("title")}</h3>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t("failedToLoad")}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 rounded-md border border-gray-200 bg-white p-6">
      <div>
        {/* Title */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">{t("title")}</h3>
        </div>

        {/* Tabs */}
        <div className="mb-6 grid grid-cols-2 sm:flex sm:flex-wrap gap-1 rounded-md p-1" style={{ backgroundColor: '#F3F4F6' }}>
          <Button
            onClick={() => setActiveTab("cpd")}
            variant="ghost"
            className={`text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-4 whitespace-nowrap ${
              activeTab === "cpd"
                ? "bg-green-600 text-white hover:bg-green-700 hover:text-white"
                : "bg-transparent text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t("cpdCertificates")}
          </Button>
          <Button
            onClick={() => setActiveTab("other")}
            variant="ghost"
            className={`text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-4 whitespace-nowrap ${
              activeTab === "other"
                ? "bg-green-600 text-white hover:bg-green-700 hover:text-white"
                : "bg-transparent text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t("otherCertificates")}
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-md border border-gray-200">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: '#F3F4F6' }}>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500">{t("months")}</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500">{t("year")}</th>
                <th className="px-6 py-4 text-right text-xs font-medium uppercase text-gray-500">{t("certificatesIssued")}</th>
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
                    {t("noData")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
