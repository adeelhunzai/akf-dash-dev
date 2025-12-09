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
  Calendar,
  ScrollText
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { DropdownMenuLabel } from "@radix-ui/react-dropdown-menu";
import { Button } from "../ui/button";
import { useGetUsersCountQuery } from "@/lib/store/api/userApi";

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
  {
    key: "new_registrations",
    title: "New Registrations",
    icon: UserRoundPlus,
    bgColor: "bg-[#B5985A]",
    iconColor: "text-[#fff]",
  },
];

const bottomMetrics = [
  {
    title: "Certificates Issued",
    value: "1,847",
    change: "+156 this month",
    icon: Award,
    bgColor: "bg-[#FC664D]",
    iconColor: "text-[#fff]",
  },
  {
    title: "Avg. Quiz Score",
    value: "86.2%",
    change: "+2.1% improvement",
    icon: BookText,
    bgColor: "bg-[#CD1D5A]",
    iconColor: "text-[#fff]",
  },
  {
    title: "New Registrations",
    value: "234",
    change: "this month",
    icon: UserRoundPlus,
    bgColor: "bg-[#B5985A]",
    iconColor: "text-[#fff]",
  },
];

export default function DashboardContent() {
  const [selectedPeriod, setSelectedPeriod] = useState("1 Year");
  const periods = ["1 Month", "3 Months", "6 Months", "1 Year"];
  
  // Fetch users count from WordPress API
  const { data: usersCount, isLoading, isError } = useGetUsersCountQuery();
  
  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };
  
  // Build metrics array with real data
  const metricsConfig = getMetricsConfig();
  const metrics = metricsConfig.map((config) => {
    let value = "--";
    let change = "Loading...";
    
    if (!isLoading && usersCount) {
      switch (config.key) {
        case "total_users":
          value = formatNumber(usersCount.total_users);
          change = "Total registered users";
          break;
        case "managers":
          // group_leader + group_leader_clone
          const totalManagers = usersCount.group_leader + usersCount.group_leader_clone;
          value = formatNumber(totalManagers);
          change = `${formatNumber(usersCount.group_leader)} active managers`;
          break;
        case "facilitators":
          // For now showing group_leader_clone as facilitators
          value = formatNumber(usersCount.group_leader_clone);
          change = "Active facilitators";
          break;
        case "learners":
          value = formatNumber(usersCount.subscriber);
          change = "Enrolled learners";
          break;
        case "active_courses":
          value = formatNumber(usersCount.active_courses);
          change = "Currently active";
          break;
        case "active_teams":
          value = formatNumber(usersCount.active_teams);
          change = "Active learning teams";
          break;
        case "new_registrations":
          value = formatNumber(usersCount.new_registrations);
          change = "This month";
          break;
      }
    }
    
    if (isError) {
      value = "Error";
      change = "Failed to load data";
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
      

      {/* Charts Section */}
      <ChartSection />
    </div>
  );
}
