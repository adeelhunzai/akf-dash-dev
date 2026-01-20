"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X, Loader2 } from "lucide-react";
import { useGetManagerLearnersQuery } from "@/lib/store/api/managerApi";

interface Learner {
  id: number;
  name: string;
  email: string;
  initials?: string;
}

interface SelectLearnersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (learners: Learner[]) => void;
  existingLearnerIds?: number[];
}

export default function SelectLearnersModal({
  open,
  onOpenChange,
  onSelect,
  existingLearnerIds = [],
}: SelectLearnersModalProps) {
  const [search, setSearch] = useState("");
  const [selectedLearners, setSelectedLearners] = useState<Learner[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [allLearners, setAllLearners] = useState<Learner[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
      setAllLearners([]);
      setHasMore(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: learnersData, isLoading, isFetching } = useGetManagerLearnersQuery(
    { page, per_page: 20, search: debouncedSearch || undefined },
    { skip: !open }
  );

  // Append new learners when data changes
  useEffect(() => {
    if (learnersData?.data) {
      const newLearners: Learner[] = learnersData.data.map((l: any) => ({
        id: l.id,
        name: l.name || l.display_name,
        email: l.email || l.user_email,
        initials: l.initials,
      }));

      if (page === 1) {
        setAllLearners(newLearners);
      } else {
        setAllLearners(prev => {
          const existingIds = new Set(prev.map(l => l.id));
          const uniqueNew = newLearners.filter(l => !existingIds.has(l.id));
          return [...prev, ...uniqueNew];
        });
      }

      // Check if there are more pages
      const totalPages = learnersData.total_pages || Math.ceil((learnersData.total || 0) / 20);
      setHasMore(page < totalPages);
    }
  }, [learnersData, page]);

  // Filter out existing learners
  const filteredLearners = allLearners.filter(
    (l) => !existingLearnerIds.includes(l.id)
  );

  // Reset selection when modal opens
  useEffect(() => {
    if (open) {
      setSelectedLearners([]);
      setSearch("");
      setPage(1);
      setAllLearners([]);
      setHasMore(true);
    }
  }, [open]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || isFetching || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
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

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const toggleLearner = (learner: Learner) => {
    setSelectedLearners((prev) => {
      const exists = prev.find((l) => l.id === learner.id);
      if (exists) {
        return prev.filter((l) => l.id !== learner.id);
      }
      return [...prev, learner];
    });
  };

  const handleAddSelected = () => {
    onSelect(selectedLearners);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0" showCloseButton={false}>
        <DialogHeader className="px-6 pt-6 pb-4 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold">Select Learners</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-gray-600"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search learners..."
              className="pl-10 h-11 border-gray-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div 
          ref={scrollContainerRef}
          className="px-6 pb-4 max-h-[350px] overflow-y-auto"
        >
          {isLoading && page === 1 ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Skeleton key={idx} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredLearners.length > 0 ? (
            <div className="space-y-2">
              {filteredLearners.map((learner: Learner) => {
                const isSelected = selectedLearners.some((l) => l.id === learner.id);
                return (
                  <div
                    key={learner.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? "bg-[#00B140]/10 border border-[#00B140]" : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => toggleLearner(learner)}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="data-[state=checked]:bg-[#00B140] data-[state=checked]:border-[#00B140]"
                    />
                    <Avatar className="h-10 w-10 bg-[#00B140]">
                      <AvatarFallback className="text-white bg-[#00B140] font-semibold text-sm">
                        {learner.initials || getInitials(learner.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[#1a1a1a] truncate">{learner.name}</div>
                      <div className="text-xs text-gray-500 truncate">{learner.email}</div>
                    </div>
                  </div>
                );
              })}
              {isFetching && page > 1 && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-[#00B140]" />
                </div>
              )}
              {!hasMore && filteredLearners.length > 0 && (
                <div className="text-center py-2 text-sm text-gray-400">
                  No more learners to load
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {debouncedSearch ? "No learners found matching your search." : "No available learners."}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t">
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-11 bg-[#00B140] hover:bg-[#00B140]/90 text-white"
            onClick={handleAddSelected}
            disabled={selectedLearners.length === 0}
          >
            Add Selected ({selectedLearners.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
