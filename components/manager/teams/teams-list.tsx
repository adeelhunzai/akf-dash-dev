"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Plus, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react";
import { useGetManagerTeamsQuery, useDeleteManagerTeamMutation } from "@/lib/store/api/managerApi";
import { useToast } from "@/hooks/use-toast";
import EditTeamModal from "./edit-team-modal";
import CreateTeamModal from "./create-team-modal";

interface TeamFacilitator {
  id: number;
  name: string;
  email: string;
  initials: string;
}

interface Team {
  id: number;
  name: string;
  facilitator: TeamFacilitator | null;
  courses_enrolled: number;
  learners_count: number;
  active_learners_count: number;
  top_performers: number;
  low_performers: number;
}

export default function TeamsList() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editTeamId, setEditTeamId] = useState<number | null>(null);
  const [deleteTeamId, setDeleteTeamId] = useState<number | null>(null);
  const { toast } = useToast();

  // Debounce search input - 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useGetManagerTeamsQuery({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined
  });

  const [deleteTeam, { isLoading: isDeleting }] = useDeleteManagerTeamMutation();

  const teams: Team[] = data?.data || [];
  const totalPages = data?.total_pages || 1;
  const total = data?.total || 0;


  // Helper function to generate page numbers with ellipsis
  const getPageNumbers = () => {
    const current = page;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, current - 1);
      let end = Math.min(totalPages - 1, current + 1);

      if (current <= 3) { start = 2; end = 5; }
      if (current >= totalPages - 2) { start = totalPages - 4; end = totalPages - 1; }

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };



  const handleDeleteTeam = async () => {
    if (!deleteTeamId) return;
    
    try {
      await deleteTeam(deleteTeamId).unwrap();
      toast({
        title: "Team deleted",
        description: "The team has been successfully deleted.",
      });
      setDeleteTeamId(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete team. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-[#1a1a1a]">Teams</h1>
        <Button 
          className="bg-[#00B140] hover:bg-[#00B140]/90 text-white font-medium"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Team
        </Button>
      </div>

      <Card className="border border-gray-100 shadow-sm bg-white">
        <CardContent className="p-6">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search team by name" 
              className="pl-10 h-11 border-gray-200 max-w-md"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="rounded-md border border-gray-100 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                  <TableHead className="font-semibold text-gray-500 h-12 pl-6">Team Name</TableHead>
                  <TableHead className="font-semibold text-gray-500 h-12">Facilitator</TableHead>
                  <TableHead className="font-semibold text-gray-500 h-12 text-center">Courses Enrolled</TableHead>
                  <TableHead className="font-semibold text-gray-500 h-12">Learners</TableHead>
                  <TableHead className="font-semibold text-gray-500 h-12 text-center">Top Performers</TableHead>
                  <TableHead className="font-semibold text-gray-500 h-12 text-center">Low Performers</TableHead>
                  <TableHead className="font-semibold text-gray-500 h-12 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16 mx-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : teams.length > 0 ? (
                  teams.map((team) => (
                    <TableRow key={team.id} className="hover:bg-gray-50/50">
                      <TableCell className="py-4 pl-6">
                        <span className="font-medium text-[#1a1a1a]">{team.name}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        {team.facilitator ? (
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 bg-[#00B140]">
                              <AvatarFallback className="text-white bg-[#00B140] font-semibold text-sm">
                                {team.facilitator.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-[#1a1a1a]">{team.facilitator.name}</div>
                              <div className="text-xs text-gray-500">{team.facilitator.email}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No facilitator</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <span className="font-medium text-[#1a1a1a]">{team.courses_enrolled}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#1a1a1a]">{team.learners_count}</span>
                          <span className="text-xs text-[#10B981] font-medium">{team.active_learners_count} active</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <ArrowUp className="w-4 h-4 text-[#10B981]" />
                          <span className="font-bold text-[#10B981]">{team.top_performers}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <ArrowDown className="w-4 h-4 text-[#EF4444]" />
                          <span className="font-bold text-[#EF4444]">{team.low_performers}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#10B981] hover:text-[#10B981] hover:bg-[#10B981]/10"
                            onClick={() => setEditTeamId(team.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#EF4444] hover:text-[#EF4444] hover:bg-[#EF4444]/10"
                            onClick={() => setDeleteTeamId(team.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No teams found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Showing {((page - 1) * perPage) + 1} to{" "}
                  {Math.min(page * perPage, total)} of{" "}
                  {total} teams
                </div>
                
                {/* Per Page Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Show:</span>
                  <Select value={perPage.toString()} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="h-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                {/* Page Numbers with Ellipsis */}
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((pageNum, index) => {
                    if (pageNum === '...') {
                      return (
                        <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                          ...
                        </span>
                      )
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(pageNum as number)}
                        className={`h-8 min-w-8 px-2 ${
                          page === pageNum 
                            ? "bg-[#16a34a] text-white hover:bg-[#15803d] border-[#16a34a]" 
                            : ""
                        }`}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  className="h-8"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Team Modal */}
      <CreateTeamModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />

      {/* Edit Team Modal */}
      <EditTeamModal
        open={editTeamId !== null}
        onOpenChange={(open) => !open && setEditTeamId(null)}
        teamId={editTeamId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteTeamId !== null} onOpenChange={(open) => !open && setDeleteTeamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this team? This action cannot be undone.
              All learners will be removed from the team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              className="bg-[#EF4444] hover:bg-[#EF4444]/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
