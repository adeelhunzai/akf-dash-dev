"use client"

import { type MetricsQueryArgs, useGetCourseCompletionRateQuery } from "@/lib/store/api/userApi";
import { Skeleton } from "@/components/ui/skeleton";

interface CircularProgressProps {
  value: number;
  total: number;
  color: string;
  label: string;
}

function CircularProgress({ value, total, color, label }: CircularProgressProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <div className="relative w-full aspect-square max-w-[90px] lg:max-w-[110px] xl:max-w-[120px]">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="42.2"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="15"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="42.2"
            fill="none"
            stroke={color}
            strokeWidth="15"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-xl lg:text-2xl xl:text-3xl font-bold text-foreground">{value.toString().padStart(2, '0')}</div>
          <div className="text-[10px] lg:text-xs text-muted-foreground">Total</div>
        </div>
      </div>
    </div>
  );
}

interface CourseCompletionChartProps {
  metricsArgs?: MetricsQueryArgs;
}

export default function CourseCompletionChart({ metricsArgs }: CourseCompletionChartProps) {
  const { data, isLoading, isFetching, isError } = useGetCourseCompletionRateQuery(metricsArgs);

  // Use API data or fallback to loading/error states
  const completed = data?.completed.count || 0;
  const inProgress = data?.in_progress.count || 0;
  const total = completed + inProgress;

  const completedPercentage = data?.completed.percentage || 0;
  const inProgressPercentage = data?.in_progress.percentage || 0;

  if (isLoading || isFetching) {
    return (
      <div className="flex flex-col md:flex-row gap-3 lg:gap-4 xl:gap-6 items-center justify-start w-full min-w-0">
        <div className="flex items-center justify-center gap-3 lg:gap-4 xl:gap-6 min-w-0 flex-shrink">
          <Skeleton className="h-[120px] w-[120px] rounded-full" />
          <Skeleton className="h-[120px] w-[120px] rounded-full" />
        </div>
        <div className="flex flex-col gap-2 lg:gap-3 xl:gap-4 min-w-0 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-destructive">Failed to load completion data</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-3 lg:gap-4 xl:gap-6 items-center justify-start w-full min-w-0">
      <div className="flex items-center justify-center gap-3 lg:gap-4 xl:gap-6 min-w-0 flex-shrink">
        <CircularProgress
          value={completed}
          total={total}
          color="#00B140"
          label="Completed"
        />
        <CircularProgress
          value={inProgress}
          total={total}
          color="#FDC300"
          label="In Progress"
        />
      </div>
      
      {/* Legend */}
      <div className="flex flex-col gap-2 lg:gap-3 xl:gap-4 min-w-0 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-[#00B140] flex-shrink-0"></div>
          <div className="text-xs lg:text-sm min-w-0">
            <div className="font-medium">Completed</div>
            <div className="text-muted-foreground text-[10px] lg:text-xs">{completed.toLocaleString()} ({completedPercentage.toFixed(2)}%)</div>
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-[#FDC300] flex-shrink-0"></div>
          <div className="text-xs lg:text-sm min-w-0">
            <div className="font-medium">In Progress</div>
            <div className="text-muted-foreground text-[10px] lg:text-xs">{inProgress.toLocaleString()} ({inProgressPercentage.toFixed(2)}%)</div>
          </div>
        </div>
      </div>
    </div>
  )
}
