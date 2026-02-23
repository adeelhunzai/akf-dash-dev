"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetManagerReportsSummaryQuery } from "@/lib/store/api/managerApi";

export default function ReportsSummaryCards({ allReports }: { allReports?: boolean }) {
  const { data: summaryData, isLoading, isFetching } = useGetManagerReportsSummaryQuery({ all_reports: allReports });
  const summary = summaryData?.data;

  const cards = [
    {
      label: "Total Active Learners",
      value: summary?.total_active_learners || 0,
      icon: Users,
      iconBg: "bg-[#00B140]",
    },
    {
      label: "Certificates Issued",
      value: summary?.certificates_issued || 0,
      icon: Award,
      iconBg: "bg-[#A855F7]", // Purple color from design
    },
  ];

  if (isLoading || isFetching) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="border border-gray-100 shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {card.label}
                  </p>
                  <p className="text-3xl font-bold text-[#1a1a1a]">
                    {card.value.toLocaleString()}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-lg ${card.iconBg} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
