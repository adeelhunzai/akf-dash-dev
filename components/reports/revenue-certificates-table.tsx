"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

  // Fetch certificate sales data
  const { data, isLoading, error } = useGetCertificateSalesQuery({ months_back: 24 })

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
        <h3 className="mb-6 text-xl font-semibold text-foreground">Certificates Sale</h3>

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
                <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">CERTIFICATES ISSUED</th>
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
