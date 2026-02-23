"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import ReportsSummaryCards from "./reports-summary-cards";
import TopPerformingCourses from "./top-courses-list";
import TopPerformingLearners from "./top-learners-list";
import LowPerformingLearnersTable from "./low-performing-learners-table";
import GenerateReportModal from "./generate-report-modal";

export default function ManagerReportsContent() {
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [allReports, setAllReports] = useState(false);

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50/30">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-[#1a1a1a]">Reports</h1>
        <div className="flex items-center gap-4">
          {/* <div className="flex items-center space-x-3 mr-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm transition-colors hover:bg-gray-50">
            <span className="text-sm font-semibold text-gray-700 cursor-pointer" onClick={() => setAllReports(!allReports)}>All Reports</span>
            <Switch 
              checked={allReports} 
              onCheckedChange={setAllReports} 
              className="data-[state=checked]:bg-[#00B140] shadow-sm"
            />
          </div> */}
          <Button 
            className="bg-[#00B140] hover:bg-[#00B140]/90 text-white font-medium px-6 h-10"
            onClick={() => setIsGenerateModalOpen(true)}
          >
            <Download className="w-4 h-4 mr-2" />
            Generate Reports
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <ReportsSummaryCards allReports={allReports} />

      {/* Top Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TopPerformingCourses allReports={allReports} />
        <TopPerformingLearners allReports={allReports} />
      </div>

      {/* Low Performing Learners Table */}
      <LowPerformingLearnersTable allReports={allReports} />

      {/* Modals */}
      <GenerateReportModal open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen} />
    </div>
  );
}
