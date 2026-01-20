"use client";

import { useState } from "react";
import { Download, FileText, BarChart3, Users, BookOpen, FileSpreadsheet, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface GenerateReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GenerateReportModal({ open, onOpenChange }: GenerateReportModalProps) {
  const [reportType, setReportType] = useState("comprehensive");
  const [dateRange, setDateRange] = useState("30");

  const reportTypes = [
    {
      id: "comprehensive",
      label: "Comprehensive",
      description: "Full analytics with all metrics and charts",
      icon: FileText,
    },
    {
      id: "summary",
      label: "Summary",
      description: "Key metrics and highlights only",
      icon: BarChart3,
    },
    {
      id: "learners",
      label: "Learners",
      description: "Detailed learner progress and performance",
      icon: Users,
    },
    {
      id: "courses",
      label: "Courses",
      description: "Course completion and engagement data",
      icon: BookOpen,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] p-0 gap-0 overflow-hidden rounded-xl">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100">
          <DialogTitle className="text-xl font-bold text-[#1a1a1a]">Generate Report</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 space-y-6">
          {/* Report Type Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">Report Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = reportType === type.id;
                return (
                  <div
                    key={type.id}
                    onClick={() => setReportType(type.id)}
                    className={cn(
                      "cursor-pointer flex items-start gap-4 p-4 rounded-xl border transition-all duration-200",
                      isSelected
                        ? "border-[#00B140] bg-[#F2FBF6] ring-1 ring-[#00B140]"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg shrink-0",
                      isSelected ? "bg-[#E6F7ED] text-[#00B140]" : "bg-gray-100 text-gray-500"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={cn("text-sm font-semibold", isSelected ? "text-[#00B140]" : "text-[#1a1a1a]")}>
                        {type.label}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {type.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export Format & Date Range Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Format */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#1a1a1a]">Export Format</h3>
              <div 
                className="cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border border-[#00B140] bg-[#F2FBF6] ring-1 ring-[#00B140] text-center"
              >
                <div className="p-2 rounded-lg bg-[#E6F7ED] text-[#00B140] mb-2">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-[#00B140]">Excel</span>
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#1a1a1a]">Date Range</h3>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full h-[88px] rounded-xl border-gray-200 bg-white">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 3 Months</SelectItem>
                  <SelectItem value="365">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F0FDFA] border border-[#CCFBF1]">
            <Info className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-[#0F766E]">Report Generation</h4>
              <p className="text-xs text-[#115E59] mt-1 leading-relaxed">
                Your report will be generated and downloaded automatically. Large reports may take a few moments to process.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-2 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200">
            Cancel
          </Button>
          <Button className="bg-[#00B140] hover:bg-[#00B140]/90 text-white font-medium pl-4 pr-6">
            <Download className="w-4 h-4 mr-2" />
            Generate & Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
