"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import ReportsSummaryCards from "./reports-summary-cards";
import TopPerformingCourses from "./top-courses-list";
import TopPerformingLearners from "./top-learners-list";
import LowPerformingLearnersTable from "./low-performing-learners-table";
import GenerateReportModal from "./generate-report-modal";

export default function ManagerReportsContent() {
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50/30">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-[#1a1a1a]">Reports</h1>
        <Button 
          className="bg-[#00B140] hover:bg-[#00B140]/90 text-white font-medium px-6"
          onClick={() => setIsGenerateModalOpen(true)}
        >
          <Download className="w-4 h-4 mr-2" />
          Generate Reports
        </Button>
      </div>

      {/* Summary Cards */}
      <ReportsSummaryCards />

      {/* Top Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TopPerformingCourses />
        <TopPerformingLearners />
      </div>

      {/* Low Performing Learners Table */}
      <LowPerformingLearnersTable />

      {/* Modals */}
      <GenerateReportModal open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen} />
    </div>
  );
}
