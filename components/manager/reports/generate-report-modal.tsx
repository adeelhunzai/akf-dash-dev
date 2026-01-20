"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Info, Users, BookOpen, LayoutGrid, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useLazyGenerateManagerReportQuery } from "@/lib/store/api/managerApi";
import { useToast } from "@/hooks/use-toast";

interface GenerateReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GenerateReportModal({ open, onOpenChange }: GenerateReportModalProps) {
  const [reportType, setReportType] = useState("summary");
  const [dateRange, setDateRange] = useState("30");
  const { toast } = useToast();
  
  const [generateReport, { isLoading }] = useLazyGenerateManagerReportQuery();

  const reportTypes = [
    {
      id: "summary",
      label: "Summary",
      description: "Key metrics and highlights only",
      icon: LayoutGrid,
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

  const handleGenerateReport = async () => {
    try {
      const result = await generateReport({ type: reportType, date_range: dateRange }).unwrap();
      
      if (result.success && result.content) {
        // Create a Blob from the CSV content
        const blob = new Blob([result.content], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', result.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Report Generated",
          description: `${result.filename} has been downloaded successfully.`,
        });
        
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Report generation error:', error);
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] p-0 gap-0 overflow-hidden rounded-xl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-bold text-[#1a1a1a]">Generate Report</DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-6 space-y-5">
          {/* Report Type Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">Report Type</h3>
            <div className="grid grid-cols-2 gap-3">
              {reportTypes.map((type, index) => {
                const Icon = type.icon;
                const isSelected = reportType === type.id;
                // Courses takes full width on its own row
                const isFullWidth = index === 2;
                return (
                  <div
                    key={type.id}
                    onClick={() => setReportType(type.id)}
                    className={cn(
                      "cursor-pointer p-4 rounded-lg border-2 transition-all duration-200",
                      isFullWidth && "col-span-1",
                      isSelected
                        ? "border-[#00B140] bg-white"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={cn("w-4 h-4", isSelected ? "text-[#00B140]" : "text-gray-500")} />
                      <span className={cn("text-sm font-semibold", isSelected ? "text-[#00B140]" : "text-[#1a1a1a]")}>
                        {type.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {type.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export Format */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">Export Format</h3>
            <div 
              className="cursor-pointer inline-flex flex-col items-center justify-center p-4 rounded-lg border-2 border-[#00B140] bg-white text-center min-w-[100px]"
            >
              <FileSpreadsheet className="w-5 h-5 text-[#00B140] mb-1" />
              <span className="text-sm font-medium text-[#1a1a1a]">Excel</span>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">Date Range</h3>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full h-11 rounded-lg border-gray-200 bg-white">
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

          {/* Info Box */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-[#F0FDFA] border border-[#CCFBF1]">
            <Info className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-[#0F766E]">Report Generation</h4>
              <p className="text-xs text-[#115E59] mt-1 leading-relaxed">
                Your report will be generated and downloaded automatically. Large reports may take a few moments to process.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-white">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200 px-6"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="bg-[#00B140] hover:bg-[#00B140]/90 text-white font-medium px-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate & Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

