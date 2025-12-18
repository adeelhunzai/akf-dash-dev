"use client";
import MetricCard from "./metric-card";
import ChartSection from "../charts/chart-section";
import { Skeleton } from "@/components/ui/skeleton";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import {
  UserRound,
  Book,
  Medal,
  GraduationCap,
  Award,
  BookText,
  UserRoundPlus,
  Check,
  ChevronDown,
  Calendar
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { DropdownMenuLabel } from "@radix-ui/react-dropdown-menu";
import { Button } from "../ui/button";
import { useGetUsersCountQuery, useGetCourseCompletionRateQuery, useGetTopCoursesQuery } from "@/lib/store/api/userApi";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";

// Skeleton component for metric cards
function MetricCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-2 md:p-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-12 w-12 rounded-lg" />
      </div>
    </div>
  );
}

// Static metrics configuration (icons and colors)
const getMetricsConfig = () => [
  {
    key: "total_users",
    title: "Total Users",
    icon: UserRound,
    bgColor: "bg-[#00B140]",
    iconColor: "text-[#fff]",
  },
  {
    key: "managers",
    title: "Manager",
    icon: Medal,
    bgColor: "bg-[#98D44E]",
    iconColor: "text-[#fff]",
  },
  {
    key: "facilitators",
    title: "Facilitators",
    icon: UserRound,
    bgColor: "bg-[#FDC300]",
    iconColor: "text-[#fff]",
  },
  {
    key: "learners",
    title: "Learners",
    icon: GraduationCap,
    bgColor: "bg-[#C4A2EA]",
    iconColor: "text-[#fff]",
  },
  {
    key: "active_courses",
    title: "Active Courses",
    icon: Book,
    bgColor: "bg-[#1275DB]",
    iconColor: "text-[#fff]",
  },
  {
    key: "active_teams",
    title: "Active Teams",
    icon: UserGroupIcon,
    bgColor: "bg-[#3FBEF4]",
    iconColor: "text-[#fff]",
  },
  // {
  //   key: "new_registrations",
  //   title: "New Registrations",
  //   icon: UserRoundPlus,
  //   bgColor: "bg-[#B5985A]",
  //   iconColor: "text-[#fff]",
  // },
];

// const bottomMetrics = [
//   {
//     title: "Certificates Issued",
//     value: "1,847",
//     change: "+156 this month",
//     icon: Award,
//     bgColor: "bg-[#FC664D]",
//     iconColor: "text-[#fff]",
//   },
//   {
//     title: "Avg. Quiz Score",
//     value: "86.2%",
//     change: "+2.1% improvement",
//     icon: BookText,
//     bgColor: "bg-[#CD1D5A]",
//     iconColor: "text-[#fff]",
//   },
//   {
//     title: "New Registrations",
//     value: "234",
//     change: "this month",
//     icon: UserRoundPlus,
//     bgColor: "bg-[#B5985A]",
//     iconColor: "text-[#fff]",
//   },
// ];

export default function DashboardContent() {
  const [selectedPeriod, setSelectedPeriod] = useState("All Time");
  const periods = ["1 Month", "3 Months", "6 Months", "1 Year", "All Time"];
  const { toast } = useToast();
  
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
  
  // Fetch users count from WordPress API with period parameter
  const periodParam = getPeriodParam(selectedPeriod);
  const { data: usersCount, isLoading, isError: isUsersError, refetch: refetchUsers } = useGetUsersCountQuery(periodParam);
  
  // Fetch course completion rate and top courses for retry functionality
  const { isError: isCompletionError, refetch: refetchCompletion } = useGetCourseCompletionRateQuery(periodParam);
  const { isError: isTopCoursesError, refetch: refetchTopCourses } = useGetTopCoursesQuery(periodParam);
  
  // Combined error state
  const hasAnyError = isUsersError || isCompletionError || isTopCoursesError;
  
  // Retry all failed queries
  const handleRetryAll = () => {
    if (isUsersError) refetchUsers();
    if (isCompletionError) refetchCompletion();
    if (isTopCoursesError) refetchTopCourses();
  };
  
  // Show toast when any API fails
  useEffect(() => {
    if (hasAnyError) {
      toast({
        variant: "destructive",
        title: "Unable to load metrics",
        description: "Some data couldn't be loaded. Click retry to try again.",
      });
    }
  }, [hasAnyError, toast]);
  
  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };
  
  // Build metrics array with real data
  const metricsConfig = getMetricsConfig();
  const metrics = metricsConfig.map((config) => {
    let value = "--";
    let change = ""; // Removed change text as per design
    
    if (!isLoading && usersCount) {
      switch (config.key) {
        case "total_users":
          // Use period-specific count if available, otherwise use total
          value = formatNumber(usersCount.total_users_for_period || usersCount.total_users);
          break;
        case "managers":
          // Manager = group_leader_clone in WordPress
          value = formatNumber(usersCount.group_leader_clone_for_period || usersCount.group_leader_clone);
          break;
        case "facilitators":
          // Facilitator = group_leader in WordPress
          value = formatNumber(usersCount.group_leader_for_period || usersCount.group_leader);
          break;
        case "learners":
          // Use period-specific count if available
          value = formatNumber(usersCount.subscriber_for_period || usersCount.subscriber);
          break;
        case "active_courses":
          value = formatNumber(usersCount.active_courses);
          break;
        case "active_teams":
          value = formatNumber(usersCount.active_teams);
          break;
        case "new_registrations":
          value = formatNumber(usersCount.new_registrations);
          break;
      }
    }
    
    if (isUsersError) {
      value = "--";
    }
    
    return {
      title: config.title,
      value,
      change,
      icon: config.icon,
      bgColor: config.bgColor,
      iconColor: config.iconColor,
    };
  });
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitor your platform performance and key metrics
          </p>
        </div>
        <div>
          {/* Period Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 h-9 bg-transparent"
              >
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{selectedPeriod}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                <span className="text-black">Filter by Period</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />
              {periods.map((period) => (
                <DropdownMenuItem
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={
                        selectedPeriod === period
                          ? "text-[#16a34a] font-medium"
                          : ""
                      }
                    >
                      {period}
                    </span>
                    {selectedPeriod === period && (
                      <Check className="w-4 h-4 text-[#16a34a]" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 7 }).map((_, idx) => (
            <MetricCardSkeleton key={idx} />
          ))
        ) : (
          metrics.slice(0, 8).map((metric, idx) => (
            <MetricCard key={idx} {...metric} />
          ))
        )}
      </div>
      
      {/* Retry button when any error occurs */}
      {hasAnyError && !isLoading && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetryAll}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry loading data
          </Button>
        </div>
      )}
      

      {/* Charts Section */}
      <ChartSection periodParam={periodParam} />
    </div>
  );
}
