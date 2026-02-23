"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useGetTopLearnersQuery } from "@/lib/store/api/managerApi";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useRef, useCallback } from "react";

export default function TopPerformingLearners({ allReports }: { allReports?: boolean }) {
  const [page, setPage] = useState(1);
  const [allLearners, setAllLearners] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data: learnersData, isLoading, isFetching } = useGetTopLearnersQuery({ page, per_page: 10, all_reports: allReports });

  // Reset when allReports changes
  useEffect(() => {
    setPage(1);
    setAllLearners([]);
  }, [allReports]);

  // Append new learners when data changes
  useEffect(() => {
    if (learnersData?.data) {
      if (page === 1) {
        setAllLearners(learnersData.data);
      } else {
        setAllLearners(prev => {
          const existingIds = new Set(prev.map(l => l.id));
          const newLearners = learnersData.data.filter((l: any) => !existingIds.has(l.id));
          return [...prev, ...newLearners];
        });
      }
      setHasMore(page < (learnersData.total_pages || 1));
    }
  }, [learnersData, page]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || isFetching || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // Load more when within 50px of the bottom
    if (scrollHeight - scrollTop - clientHeight < 50) {
      setPage(prev => prev + 1);
    }
  }, [isFetching, hasMore]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const rankColors = [
    "bg-[#FDC300]", // 1st - Gold/Yellow
    "bg-[#FDC300]", // 2nd
    "bg-[#FDC300]", // 3rd
    "bg-[#FDC300]", // 4th
    "bg-[#FDC300]", // 5th
  ];

  return (
    <Card className="border border-gray-100 shadow-sm rounded-xl h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
        <div>
          <CardTitle className="text-lg font-bold text-[#1a1a1a]">
            Top Performing Learners
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal mt-1">
            Highest course completion and scores
          </p>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0 flex-1 overflow-hidden">
        {(isLoading || isFetching) && page === 1 ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div 
            ref={scrollContainerRef}
            className="space-y-4 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
          >
            {allLearners.map((learner: any, index: number) => (
              <div
                key={learner.id}
                className="flex items-center gap-4 bg-[#F8F9FB] rounded-xl p-4 transition-colors hover:bg-gray-50"
              >
                <div
                  className={`w-10 h-10 rounded-lg ${
                    rankColors[index % rankColors.length] || "bg-[#FDC300]"
                  } flex items-center justify-center text-white font-bold text-sm shrink-0`}
                >
                  #{index + 1}
                </div>
                <Avatar className={`w-10 h-10 ${learner.color || "bg-[#00B140]"}`}>
                  <AvatarFallback className="text-white text-xs font-medium bg-transparent">
                    {learner.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-[#1a1a1a] truncate">
                    {learner.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className="truncate">{learner.department}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>{learner.courses_count} courses</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>{learner.certificates_count} certificates</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-[#10B981]">
                    {learner.score}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {learner.last_active}
                  </p>
                </div>
              </div>
            ))}
            {isFetching && page > 1 && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            )}
            {!hasMore && allLearners.length > 5 && (
              <p className="text-center text-xs text-muted-foreground py-2">
                All learners loaded
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
