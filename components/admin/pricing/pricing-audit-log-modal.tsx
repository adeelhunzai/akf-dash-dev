import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface PricingAuditLogModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { ExportModal } from "@/components/ui/export-modal"

import { useGetAuditLogsQuery, useGetCountriesQuery } from "@/lib/store/api/pricingApi"
import { format } from "date-fns"
import Papa from "papaparse"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { useToast } from "@/hooks/use-toast"

export function PricingAuditLogModal({ open, onOpenChange }: PricingAuditLogModalProps) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const { data: response, isLoading } = useGetAuditLogsQuery({ entity_type: 'pricing', per_page: 50 }, { skip: !open })
  const { data: countriesRes } = useGetCountriesQuery(undefined, { skip: !open })
  const logs = response?.data || []
  const countries = countriesRes?.data || []

  const handleExport = async (formatType: "csv" | "pdf") => {
    if (!logs.length) {
      toast({ title: "Export Failed", description: "No data available to export.", variant: "destructive" })
      return
    }

    setIsExporting(true)

    try {
      // Prepare localized data for export
      const exportData = logs.map(log => {
        let changedField = "N/A"
        let oldVal = "-"
        let newVal = "-"
        let countryCode = log.new_data?.country_code || log.old_data?.country_code || "XX"
        let country = countries.find(c => c.code === countryCode)?.name || countryCode
        let currency = log.new_data?.currency || log.old_data?.currency || "USD"

        const formatCurrency = (val: any) => {
          if (val === null || val === undefined || val === '') return "-"
          const num = Number(val)
          if (isNaN(num)) return val
          try {
            const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num)
            // Replace non-breaking spaces (U+00A0) and narrow no-break spaces (U+202F) with standard space for CSV compatibility
            return formatted.replace(/[\u00A0\u202F]/g, ' ')
          } catch {
            return `${currency} ${num}`
          }
        }

        let actionDisplay = log.action
        if (log.action === "pricing_updated") actionDisplay = "Price Update"
        else if (log.action === "pricing_created") actionDisplay = "New Rule"
        else if (log.action === "pricing_deleted") actionDisplay = "Rule Deleted"
        else if (log.action.includes("currency")) actionDisplay = "Currency Update"

        if (log.old_data && log.new_data) {
          const fieldsToCheck = [
            { key: 'price', label: 'Price', isCurrency: true },
            { key: 'effective_from', label: 'Effective Date', isCurrency: false },
            { key: 'currency', label: 'Currency', isCurrency: false },
            { key: 'tax_rate', label: 'Tax Rate', isCurrency: false },
            { key: 'discount_percent', label: 'Discount', isCurrency: false },
            { key: 'is_active', label: 'Status', isCurrency: false }
          ] as const

          for (const field of fieldsToCheck) {
            if (String(log.old_data[field.key]) !== String(log.new_data[field.key])) {
              changedField = field.label
              if (field.isCurrency) {
                oldVal = formatCurrency(log.old_data[field.key])
                newVal = formatCurrency(log.new_data[field.key])
              } else {
                oldVal = String(log.old_data[field.key] ?? "-")
                newVal = String(log.new_data[field.key] ?? "-")
              }
              break
            }
          }
        } else if (!log.old_data && log.new_data) {
          changedField = "All Fields"
          newVal = "Created"
        } else if (log.old_data && !log.new_data) {
          changedField = "All Fields"
          oldVal = "Deleted"
        }

        // Use figure spaces (\u2007) so Excel doesn't strip them during auto-size
        return {
          "Timestamp\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007": format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
          "Action\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007": actionDisplay,
          "Country\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007": country,
          "Changed Field\u2007\u2007\u2007\u2007\u2007\u2007\u2007": changedField,
          "Old Value\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007": oldVal,
          "New Value\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007": newVal,
          "User\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007\u2007": log.user_name
        }
      })

      const filename = `pricing-audit-log-${format(new Date(), "yyyy-MM-dd")}`

      if (formatType === "csv") {
        const csvContent = Papa.unparse(exportData)
        const csvWithBOM = '\uFEFF' + csvContent; // Add UTF-8 BOM so Excel opens it correctly
        const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `${filename}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else if (formatType === "pdf") {
        const doc = new jsPDF()
        
        doc.setFontSize(16)
        doc.text("Pricing Audit Log", 14, 15)
        
        doc.setFontSize(10)
        doc.setTextColor(100)
        doc.text(`Generated on ${format(new Date(), "PPpp")}`, 14, 22)

        const tableColumn = ["Timestamp", "Action", "Country", "Changed Field", "Old Value", "New Value", "User"]
        // The PDF library doesn't need the padded headers, so we just extract the row values regardless of key name.
        const tableRows = exportData.map(item => Object.values(item))

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 28,
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [0, 180, 75] },
        })

        doc.save(`${filename}.pdf`)
      }

      toast({ title: "Export Successful", description: `Your ${formatType.toUpperCase()} has been downloaded.`, variant: "default" })
      setIsExportModalOpen(false)
    } catch (err) {
      console.error(err)
      toast({ title: "Export Failed", description: "An error occurred while generating the file.", variant: "destructive" })
    } finally {
      setIsExporting(false)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] md:max-w-[900px] p-0 gap-0 bg-white overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="p-5 sm:p-6 pb-4 shrink-0">
          <DialogTitle className="text-xl font-bold text-gray-900">
            Pricing Audit Log
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Track all pricing changes and modifications
          </p>
        </DialogHeader>

        <div className="px-5 sm:px-6 pb-2 overflow-y-auto overflow-x-hidden min-h-0 flex flex-col">
          <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <Table className="min-w-[800px] w-full">
                <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-xs text-gray-500 py-3 uppercase">Timestamp</TableHead>
                  <TableHead className="font-semibold text-xs text-gray-500 py-3 uppercase">Action</TableHead>
                  <TableHead className="font-semibold text-xs text-gray-500 py-3 uppercase">Country</TableHead>
                  <TableHead className="font-semibold text-xs text-gray-500 py-3 uppercase">Field</TableHead>
                  <TableHead className="font-semibold text-xs text-gray-500 py-3 uppercase min-w-[90px]">Old Value</TableHead>
                  <TableHead className="font-semibold text-xs text-gray-500 py-3 uppercase min-w-[90px]">New Value</TableHead>
                  <TableHead className="font-semibold text-xs text-gray-500 py-3 uppercase">User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell className="py-4"><Skeleton className="h-10 w-24" /></TableCell>
                      <TableCell className="py-4"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="py-4"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="py-4"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="py-4"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="py-4"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="py-4"><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No audit logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    let changedField = "N/A";
                    let oldVal = "-";
                    let newVal = "-";
                    let countryCode = log.new_data?.country_code || log.old_data?.country_code || "XX";
                    
                    // Map country code to name
                    let country = countries.find(c => c.code === countryCode)?.name || countryCode;
                    
                    // Get the underlying currency from old or new data (default USD)
                    let currency = log.new_data?.currency || log.old_data?.currency || "USD";

                    const formatCurrency = (val: any) => {
                      if (val === null || val === undefined || val === '') return "-";
                      const num = Number(val);
                      if (isNaN(num)) return val;
                      try {
                        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
                      } catch {
                        return `${currency} ${num}`;
                      }
                    };

                    // Evaluate action text
                    let actionDisplay = log.action;
                    if (log.action === "pricing_updated") actionDisplay = "Price Update";
                    else if (log.action === "pricing_created") actionDisplay = "New Rule";
                    else if (log.action === "pricing_deleted") actionDisplay = "Rule Deleted";
                    else if (log.action.includes("currency")) actionDisplay = "Currency Update";

                    // Fields mapping logic to find what changed
                    if (log.old_data && log.new_data) {
                      const fieldsToCheck = [
                        { key: 'price', label: 'Price', isCurrency: true },
                        { key: 'effective_from', label: 'Effective Date', isCurrency: false },
                        { key: 'currency', label: 'Currency', isCurrency: false },
                        { key: 'tax_rate', label: 'Tax Rate', isCurrency: false },
                        { key: 'discount_percent', label: 'Discount', isCurrency: false },
                        { key: 'is_active', label: 'Status', isCurrency: false }
                      ] as const;
                      
                      for (const field of fieldsToCheck) {
                        if (String(log.old_data[field.key]) !== String(log.new_data[field.key])) {
                          changedField = field.label;
                          if (field.isCurrency) {
                            oldVal = formatCurrency(log.old_data[field.key]);
                            newVal = formatCurrency(log.new_data[field.key]);
                          } else {
                            oldVal = String(log.old_data[field.key] ?? "-");
                            newVal = String(log.new_data[field.key] ?? "-");
                          }
                          break; // Just show the first changed field in this simplified view
                        }
                      }
                    } else if (!log.old_data && log.new_data) {
                      changedField = "All Fields";
                      newVal = "Created";
                    } else if (log.old_data && !log.new_data) {
                      changedField = "All Fields";
                      oldVal = "Deleted";
                    }

                    return (
                      <TableRow key={log.id} className="hover:bg-gray-50/50">
                        <TableCell className="text-[13px] text-gray-600 align-top py-4 whitespace-pre-line">
                          {format(new Date(log.created_at), "yyyy-MM-dd\nHH:mm:ss")}
                        </TableCell>
                        <TableCell className="align-top py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            actionDisplay === "Price Update" ? "bg-blue-100/50 text-blue-600" : 
                            actionDisplay === "New Rule" ? "bg-green-100/50 text-green-600" :
                            "bg-yellow-100/50 text-yellow-600"
                          }`}>
                            {actionDisplay}
                          </span>
                        </TableCell>
                        <TableCell className="text-[13px] text-gray-900 align-top py-4">{country}</TableCell>
                        <TableCell className="text-[13px] text-gray-900 align-top py-4 max-w-[120px]">{changedField}</TableCell>
                        <TableCell className="text-[13px] text-gray-600 align-top py-4">{oldVal}</TableCell>
                        <TableCell className="text-[13px] font-semibold text-green-600 align-top py-4">{newVal}</TableCell>
                        <TableCell className="text-[13px] text-gray-900 align-top py-4 max-w-[100px]">{log.user_name}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 pt-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 mt-2 bg-gray-50/30 shrink-0 gap-4">
          <span className="text-sm text-gray-500 w-full sm:w-auto text-center sm:text-left">
            Showing {logs.length} recent changes
          </span>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="px-4 sm:px-6"
            >
              Close
            </Button>
            <Button 
              className="bg-[#00B44B] hover:bg-[#009b40] text-white px-6"
              onClick={() => setIsExportModalOpen(true)}
              disabled={isLoading || logs.length === 0}
            >
              Export Full Log
            </Button>
          </div>
        </div>
      </DialogContent>

      <ExportModal 
        open={isExportModalOpen} 
        onOpenChange={setIsExportModalOpen} 
        onExport={handleExport}
        isExporting={isExporting}
      />
    </Dialog>
  )
}
