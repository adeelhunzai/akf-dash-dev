"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  Users,
  Award,
  CircleCheck,
} from "lucide-react";
import UserDistributionChart from "@/components/charts/user-distribution-chart";
import DateRangePicker from "@/components/ui/date-range-picker";
import { type DateRange } from "react-day-picker";
import { useGetFacilitatorDashboardQuery } from "@/lib/store/api/userApi";
import { Skeleton } from "@/components/ui/skeleton";

export default function FacilitatorDashboardContent() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("All Time");
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const periods = ["1 Month", "3 Months", "6 Months", "1 Year", "All Time"];
  
  // Map frontend period to API period format
  const getPeriodParam = (period: string): string | undefined => {
    const periodMap: Record<string, string> = {
      "1 Month": "1month",
      "3 Months": "3months",
      "6 Months": "6months",
      "1 Year": "1year",
      "All Time": "all",
    };
    return periodMap[period];
  };
  
  const periodParam = getPeriodParam(selectedPeriod);
  const rangeStart = customRange?.from;
  const rangeEnd = customRange?.to;
  const hasCustomRange = Boolean(rangeStart && rangeEnd);

  const queryArg = useMemo(() => {
    if (hasCustomRange && rangeStart && rangeEnd) {
      return { from: rangeStart.toISOString(), to: rangeEnd.toISOString() };
    }
    return periodParam;
  }, [hasCustomRange, periodParam, rangeStart, rangeEnd]);

  const { data: dashboardData, isLoading, isFetching, isError } = useGetFacilitatorDashboardQuery(queryArg, {
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });
  
  const summary = dashboardData?.data?.summary;
  const courseCompletion = dashboardData?.data?.course_completion;
  const userDistribution = dashboardData?.data?.user_distribution;
  
  const stats = [
    {
      label: "Total Courses Assigned",
      value: summary?.courses_assigned?.toString() || "0",
      icon: BookOpen,
      iconBg: "bg-[#00B140]",
    },
    {
      label: "Learners Enrolled",
      value: summary?.learners_enrolled?.toString() || "0",
      icon: Users,
      iconBg: "bg-[#C4A2EA]",
    },
    {
      label: "Certificates Issued",
      value: summary?.certificates_issued?.toString() || "0",
      icon: Award,
      iconBg: "bg-cyan-400",
    },
    {
      label: "Course Completion Rate",
      value: summary?.completion_rate || "0%",
      icon: CircleCheck,
      iconBg: "bg-orange-500",
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor your platform performance and key metrics
          </p>
        </div>
        <DateRangePicker
          selectedPeriod={selectedPeriod}
          customRange={customRange}
          onRangeApply={range => setCustomRange(range)}
          onPeriodSelect={period => {
            setSelectedPeriod(period);
            if (period !== "Custom Range") {
              setCustomRange(undefined);
            }
          }}
          quickRanges={periods}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoading || isFetching ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx}>
              <CardContent className="p-5">
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold mb-1">{stat.value}</p>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-lg ${stat.iconBg} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Completion Rate */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-1">
              Course Completion Rate
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Completed vs In Progress
            </p>
            {isLoading || isFetching ? (
              <div className="flex items-center justify-center h-40">
                <Skeleton className="w-full h-full" />
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-3 lg:gap-4 xl:gap-6 items-center justify-start w-full min-w-0">
                <div className="flex items-center justify-center gap-3 lg:gap-4 xl:gap-6 min-w-0 flex-shrink">
                  {/* Completed Circle */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="relative w-full aspect-square max-w-[90px] lg:max-w-[110px] xl:max-w-[120px]">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="42.2"
                          fill="none"
                          stroke="#f3f4f6"
                          strokeWidth="15"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="42.2"
                          fill="none"
                          stroke="#00B140"
                          strokeWidth="15"
                          strokeDasharray={`${2 * Math.PI * 42.2}`}
                          strokeDashoffset={`${2 * Math.PI * 42.2 * (1 - (courseCompletion?.completed_percentage || 0) / 100)}`}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-xl lg:text-2xl xl:text-3xl font-bold text-foreground">
                          {courseCompletion?.completed || 0}
                        </div>
                        <div className="text-[10px] lg:text-xs text-muted-foreground">Total</div>
                      </div>
                    </div>
                  </div>

                  {/* In Progress Circle */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="relative w-full aspect-square max-w-[90px] lg:max-w-[110px] xl:max-w-[120px]">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="42.2"
                          fill="none"
                          stroke="#f3f4f6"
                          strokeWidth="15"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="42.2"
                          fill="none"
                          stroke="#FDC300"
                          strokeWidth="15"
                          strokeDasharray={`${2 * Math.PI * 42.2}`}
                          strokeDashoffset={`${2 * Math.PI * 42.2 * (1 - (courseCompletion?.in_progress_percentage || 0) / 100)}`}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-xl lg:text-2xl xl:text-3xl font-bold text-foreground">
                          {courseCompletion?.in_progress || 0}
                        </div>
                        <div className="text-[10px] lg:text-xs text-muted-foreground">Total</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-2 lg:gap-3 xl:gap-4 min-w-0 flex-shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-[#00B140] flex-shrink-0"></div>
                    <div className="text-xs lg:text-sm min-w-0">
                      <div className="font-medium">Completed</div>
                      <div className="text-muted-foreground text-[10px] lg:text-xs">
                        {courseCompletion?.completed || 0} ({courseCompletion?.completed_percentage || 0}%)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-[#FDC300] flex-shrink-0"></div>
                    <div className="text-xs lg:text-sm min-w-0">
                      <div className="font-medium">In Progress</div>
                      <div className="text-muted-foreground text-[10px] lg:text-xs">
                        {courseCompletion?.in_progress || 0} ({courseCompletion?.in_progress_percentage || 0}%)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Global Learners Distribution */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Global Learners Distribution
            </h2>
            {isLoading || isFetching ? (
              <div className="flex items-center justify-center h-40">
                <Skeleton className="w-full h-full" />
              </div>
            ) : (
              <UserDistributionChart data={userDistribution} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
