"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Upload, Download, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useGetPricingRulesQuery, PricingRule } from "@/lib/store/api/pricingApi"
import { PricingTableSkeleton } from "./pricing-table-skeleton"
import { AddCountryModal } from "./add-country-modal"
import { PricingAuditLogModal } from "./pricing-audit-log-modal"
import { useBulkImportPricingMutation, useExportPricingMutation } from "@/lib/store/api/pricingApi"
import { useToast } from "@/hooks/use-toast"
import { useRef } from "react"

export default function PricingManagementContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [regionFilter, setRegionFilter] = useState("all-regions")
  const [statusFilter, setStatusFilter] = useState("all-status")
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null)
  const [isImportSuccessModalOpen, setIsImportSuccessModalOpen] = useState(false)
  const [importResult, setImportResult] = useState({ count: 0, message: "" })

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1) // Reset page on new search
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [regionFilter, statusFilter])

  // Map filters to API expected formats
  const apiFormatRegion = regionFilter === 'all-regions' ? undefined : regionFilter
  const apiFormatStatus = statusFilter === 'all-status' ? undefined : statusFilter

  // Fetch Pricing Data
  const { data: pricingResponse, isLoading, isError, isFetching } = useGetPricingRulesQuery({
    search: debouncedSearch || undefined,
    region: apiFormatRegion,
    status: apiFormatStatus,
    page: currentPage,
    per_page: 10,
  })

  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [bulkImport, { isLoading: isImporting }] = useBulkImportPricingMutation()
  const [exportData, { isLoading: isExporting }] = useExportPricingMutation()

  const totalPages = pricingResponse?.meta?.total_pages || 1

  const handleExport = async () => {
    try {
      const rawResponse = await exportData({ format: 'csv' }).unwrap()
      const response = JSON.parse(rawResponse)
      
      if (!response.success || !response.data) {
        throw new Error("Invalid export data")
      }

      // Ensure CRLF endings for Excel compatibility and add BOM for correct UTF-8 decoding
      const csvContent = '\uFEFF' + response.data.replace(/\r?\n/g, '\r\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', response.filename || `pricing-rules-export-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast({ title: "Success", description: "Pricing data exported successfully." })
    } catch (error) {
      toast({ title: "Export Failed", description: "Could not export pricing data.", variant: "destructive" })
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await bulkImport(formData).unwrap()
      if (res.success) {
        setImportResult({ count: res.rows_processed || 0, message: res.message || `Successfully imported ${res.rows_processed} pricing rules.` })
        setIsImportSuccessModalOpen(true)
      } else {
        toast({ title: "Import Failed", description: res.message || "Failed to import.", variant: "destructive" })
      }
    } catch (error: any) {
      toast({ title: "Import Failed", description: error?.data?.message || "An error occurred during import.", variant: "destructive" })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header section matching design exactly */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-gray-900">Pricing Management</h1>
            <p className="text-gray-500 text-sm mt-1">Manage country-specific pricing and certificates</p>
          </div>
          <Button 
            onClick={() => {
              setEditingRule(null)
              setIsAddModalOpen(true)
            }}
            className="bg-[#00B44B] hover:bg-[#009b40] text-white rounded-md px-4 py-2 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Country
          </Button>
        </div>

        {/* Main card container */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {/* Top Controls Bar */}
          <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex-1 w-full max-w-2xl relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by country or currency..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full bg-white border-gray-200"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-[140px] bg-white border-gray-200">
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-regions">All Regions</SelectItem>
                  <SelectItem value="north-america">North America</SelectItem>
                  <SelectItem value="europe">Europe</SelectItem>
                  <SelectItem value="asia">Asia</SelectItem>
                  <SelectItem value="oceania">Oceania</SelectItem>
                  <SelectItem value="south-america">South America</SelectItem>
                  <SelectItem value="africa">Africa</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] bg-white border-gray-200">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-status">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <div className="hidden lg:flex items-center gap-3 ml-2">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <Button 
                  variant="outline" 
                  className="border-gray-200 bg-white"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                >
                  <Upload className={`w-4 h-4 mr-2 ${isImporting ? 'animate-pulse' : ''}`} />
                  {isImporting ? 'Importing...' : 'Bulk Import'}
                </Button>
                <Button 
                  variant="outline" 
                  className="border-gray-200 bg-white"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  <Download className={`w-4 h-4 mr-2 ${isExporting ? 'animate-pulse' : ''}`} />
                  {isExporting ? 'Exporting...' : 'Export CSV'}
                </Button>
                <Button 
                  className="bg-[#00B44B] hover:bg-[#009b40] text-white"
                  onClick={() => setIsAuditLogOpen(true)}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Audit Log
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Action Buttons (Visible only on small screens) */}
          <div className="p-4 border-b border-gray-200 lg:hidden flex gap-2 overflow-x-auto">
            <Button 
              variant="outline" 
              className="border-gray-200 bg-white shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              <Upload className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
            <Button 
              variant="outline" 
              className="border-gray-200 bg-white shrink-0"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              className="bg-[#00B44B] hover:bg-[#009b40] text-white shrink-0"
              onClick={() => setIsAuditLogOpen(true)}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Audit Log
            </Button>
          </div>

          {/* Table Content */}
          {isLoading ? (
            <PricingTableSkeleton />
          ) : isError ? (
            <div className="p-8 text-center text-red-500 bg-red-50/50">
              Failed to load pricing rules. Please try again.
            </div>
          ) : (
            <div className="relative">
              <div className={`overflow-x-auto transition-opacity duration-200 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-gray-50/50">
                      <TableHead className="font-semibold text-xs text-gray-500 py-4 px-6 w-[200px]">COUNTRY</TableHead>
                      <TableHead className="font-semibold text-xs text-gray-500 py-4 px-6">TYPE</TableHead>
                      <TableHead className="font-semibold text-xs text-gray-500 py-4 px-6">CURRENCY</TableHead>
                      <TableHead className="font-semibold text-xs text-gray-500 py-4 px-6">CPD PRICE</TableHead>
                      <TableHead className="font-semibold text-xs text-gray-500 py-4 px-6">STATUS</TableHead>
                      <TableHead className="font-semibold text-xs text-gray-500 py-4 px-6">EFFECTIVE DATE</TableHead>
                      <TableHead className="font-semibold text-xs text-gray-500 py-4 px-6 text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricingResponse?.data && pricingResponse.data.length > 0 ? (
                      pricingResponse.data.map((row) => (
                        <TableRow key={row.id} className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                          <TableCell className="font-bold text-[13px] px-6 py-4">{row.country_name}</TableCell>
                          <TableCell className="text-[13px] text-gray-600 px-6 py-4 capitalize">{row.region}</TableCell>
                          <TableCell className="text-[13px] text-gray-600 px-6 py-4">{row.currency}</TableCell>
                          <TableCell className="text-[13px] text-gray-600 px-6 py-4">{row.price_formatted || '-'}</TableCell>
                          <TableCell className="px-6 py-4">
                            <span 
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                row.status === 'active' 
                                  ? 'bg-green-100 text-[#00B44B]' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {row.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-[13px] text-gray-600 px-6 py-4">
                            {row.effective_from ? new Date(row.effective_from).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell className="text-right px-6 py-4">
                            <button 
                              onClick={() => {
                                setEditingRule(row)
                                setIsAddModalOpen(true)
                              }}
                              className="text-[#00B44B] font-semibold text-[13px] hover:underline px-2"
                            >
                              Edit
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-48 text-center text-gray-500">
                          No pricing rules found matching your filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination Controls */}
              {pricingResponse?.meta && pricingResponse.meta.total > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Showing <span className="font-medium text-gray-900">{(currentPage - 1) * 10 + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * 10, pricingResponse.meta.total)}</span> of <span className="font-medium text-gray-900">{pricingResponse.meta.total}</span> entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-gray-200"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || isFetching}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="text-sm font-medium text-gray-700 px-2 flex items-center gap-1">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-gray-200"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || isFetching}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <AddCountryModal 
        open={isAddModalOpen} 
        onOpenChange={(open) => {
          setIsAddModalOpen(open)
          if (!open) setEditingRule(null)
        }} 
        initialData={editingRule}
      />

      <PricingAuditLogModal
        open={isAuditLogOpen}
        onOpenChange={setIsAuditLogOpen}
      />

      <Dialog open={isImportSuccessModalOpen} onOpenChange={setIsImportSuccessModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl pt-4">Import Successful</DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              {importResult.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button 
              type="button" 
              onClick={() => setIsImportSuccessModalOpen(false)}
              className="bg-[#00B44B] hover:bg-[#009b40] text-white w-full sm:w-auto min-w-[120px]"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

