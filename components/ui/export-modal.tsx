"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: "csv" | "pdf") => void;
  isExporting?: boolean;
}

export function ExportModal({ open, onOpenChange, onExport, isExporting = false }: ExportModalProps) {
  const [format, setFormat] = useState<"csv" | "pdf">("csv");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm text-gray-500">
            Choose the format you would like to export the log to.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => setFormat("csv")}
              className={cn(
                "cursor-pointer p-4 rounded-lg border-2 flex flex-col items-center justify-center transition-all",
                format === "csv"
                  ? "border-[#00B140] bg-[#00B140]/5"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <FileSpreadsheet className={cn("w-8 h-8 mb-2", format === "csv" ? "text-[#00B140]" : "text-gray-400")} />
              <span className={cn("font-medium", format === "csv" ? "text-[#00B140]" : "text-gray-600")}>
                CSV File
              </span>
            </div>
            <div
              onClick={() => setFormat("pdf")}
              className={cn(
                "cursor-pointer p-4 rounded-lg border-2 flex flex-col items-center justify-center transition-all",
                format === "pdf"
                  ? "border-red-500 bg-red-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <FileText className={cn("w-8 h-8 mb-2", format === "pdf" ? "text-red-500" : "text-gray-400")} />
              <span className={cn("font-medium", format === "pdf" ? "text-red-500" : "text-gray-600")}>
                PDF Document
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button 
            className="bg-[#00B140] hover:bg-[#00B140]/90 text-white" 
            onClick={() => onExport(format)}
            disabled={isExporting}
          >
            {isExporting ? "Exporting..." : "Download"}
            {!isExporting && <Download className="w-4 h-4 ml-2" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
