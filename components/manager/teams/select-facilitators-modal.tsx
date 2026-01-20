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
import { useGetManagerFacilitatorsQuery } from "@/lib/store/api/managerApi";

interface Facilitator {
  id: number;
  name: string;
  email: string;
  initials?: string;
  organization?: string;
}

interface SelectFacilitatorsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (facilitators: Facilitator[]) => void;
  existingFacilitatorIds?: number[];
}

export default function SelectFacilitatorsModal({
  open,
  onOpenChange,
  onSelect,
  existingFacilitatorIds = [],
}: SelectFacilitatorsModalProps) {
  const [search, setSearch] = useState("");
  const [selectedFacilitators, setSelectedFacilitators] = useState<Facilitator[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [allFacilitators, setAllFacilitators] = useState<Facilitator[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
      setAllFacilitators([]);
      setHasMore(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: facilitatorsData, isLoading, isFetching } = useGetManagerFacilitatorsQuery(
    { page, per_page: 20, search: debouncedSearch || undefined },
    { skip: !open }
  );

  // Append new facilitators when data changes
  useEffect(() => {
    if (facilitatorsData?.data) {
      const newFacilitators: Facilitator[] = facilitatorsData.data.map((f: any) => ({
        id: f.id,
        name: f.name || f.display_name,
        email: f.email || '',
        initials: f.initials,
        organization: f.organization,
      }));

      if (page === 1) {
        setAllFacilitators(newFacilitators);
      } else {
        setAllFacilitators(prev => {
          const existingIds = new Set(prev.map(f => f.id));
          const uniqueNew = newFacilitators.filter(f => !existingIds.has(f.id));
          return [...prev, ...uniqueNew];
        });
      }

      // Check if there are more pages
      const totalPages = facilitatorsData.total_pages || Math.ceil((facilitatorsData.total || 0) / 20);
      setHasMore(page < totalPages);
    }
  }, [facilitatorsData, page]);

  // Filter out existing facilitators
  const filteredFacilitators = allFacilitators.filter(
    (f) => !existingFacilitatorIds.includes(f.id)
  );

  // Reset selection when modal opens
  useEffect(() => {
    if (open) {
      setSelectedFacilitators([]);
      setSearch("");
      setPage(1);
      setAllFacilitators([]);
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

  const toggleFacilitator = (facilitator: Facilitator) => {
    setSelectedFacilitators((prev) => {
      const exists = prev.find((f) => f.id === facilitator.id);
      if (exists) {
        return prev.filter((f) => f.id !== facilitator.id);
      }
      return [...prev, facilitator];
    });
  };

  const handleAddSelected = () => {
    onSelect(selectedFacilitators);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0" showCloseButton={false}>
        <DialogHeader className="px-6 pt-6 pb-4 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold">Select Facilitators</DialogTitle>
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
              placeholder="Search facilitators..."
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
          ) : filteredFacilitators.length > 0 ? (
            <div className="space-y-2">
              {filteredFacilitators.map((facilitator) => {
                const isSelected = selectedFacilitators.some((f) => f.id === facilitator.id);
                return (
                  <div
                    key={facilitator.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? "bg-[#00B140]/10 border border-[#00B140]" : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => toggleFacilitator(facilitator)}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="data-[state=checked]:bg-[#00B140] data-[state=checked]:border-[#00B140]"
                    />
                    <Avatar className="h-10 w-10 bg-[#00B140]">
                      <AvatarFallback className="text-white bg-[#00B140] font-semibold text-sm">
                        {facilitator.initials || getInitials(facilitator.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[#1a1a1a] truncate">{facilitator.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {facilitator.organization || facilitator.email}
                      </div>
                    </div>
                  </div>
                );
              })}
              {isFetching && page > 1 && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-[#00B140]" />
                </div>
              )}
              {!hasMore && filteredFacilitators.length > 0 && (
                <div className="text-center py-2 text-sm text-gray-400">
                  No more facilitators to load
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {debouncedSearch ? "No facilitators found matching your search." : "No available facilitators."}
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
            disabled={selectedFacilitators.length === 0}
          >
            Add Selected ({selectedFacilitators.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
