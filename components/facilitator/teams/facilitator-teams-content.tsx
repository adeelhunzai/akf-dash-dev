"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Plus, Eye, Trash2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useGetFacilitatorTeamsQuery, useGetFacilitatorLearnersQuery, useGetFacilitatorLearnerDetailsQuery, useGetUsersListQuery, useAddLearnersToTeamMutation, useRemoveLearnerFromTeamMutation } from "@/lib/store/api/userApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";

export default function FacilitatorTeamsContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const source = searchParams.get('source');

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedLearnerId, setSelectedLearnerId] = useState<number | null>(null);

  // Open modal if learner param exists
  useEffect(() => {
    const learnerId = searchParams.get('learner');
    if (learnerId) {
      setSelectedLearnerId(parseInt(learnerId));
      setViewModalOpen(true);
    }
  }, [searchParams]);
  
  // Add learner modal states
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [userPage, setUserPage] = useState(1);

  // Mutations
  const [addLearners, { isLoading: isAdding }] = useAddLearnersToTeamMutation();
  const [removeLearner, { isLoading: isRemoving }] = useRemoveLearnerFromTeamMutation();

  // Fetch teams and learners data
  const { data: teamsData, isLoading: teamsLoading } = useGetFacilitatorTeamsQuery();
  const { data: learnersData, isLoading: learnersLoading, isFetching } = useGetFacilitatorLearnersQuery({
    search: searchQuery || undefined,
    team: selectedTeam !== "all" ? parseInt(selectedTeam) : undefined,
  });

  // Fetch learner details for view modal
  const { data: learnerDetailsData, isLoading: learnerDetailsLoading } = useGetFacilitatorLearnerDetailsQuery(
    selectedLearnerId!,
    { skip: !selectedLearnerId || !viewModalOpen }
  );

  // Fetch users for add modal
  const { data: usersData, isLoading: usersLoading } = useGetUsersListQuery(
    {
      page: userPage,
      per_page: 20,
      search: userSearchQuery || undefined,
      role: "all",
    },
    { skip: !addModalOpen }
  );

  const teams = teamsData?.data?.teams || [];
  const courseAssignments = teamsData?.data?.course_assignments || [];
  const learners = learnersData?.data?.learners || [];
  const learnerDetails = learnerDetailsData?.data;
  const users = usersData?.users || [];

  // Handlers
  const handleViewLearner = (learnerId: number) => {
    // If we click View explicitly, update URL to reflect state (optional but good for consistency)
    // Or just open modal
    setSelectedLearnerId(learnerId);
    setViewModalOpen(true);
  };

  const handleViewModalOpenChange = (open: boolean) => {
    setViewModalOpen(open);
    if (!open) {
      setSelectedLearnerId(null);
      
      // Handle back navigation or URL cleanup
      if (source === 'reports') {
        router.push(`/${locale}/facilitator/reports`);
      } else {
        // Clean up URL params when closing modal if it was opened via URL
        if (searchParams.get('learner')) {
          const newParams = new URLSearchParams(searchParams.toString());
          newParams.delete('learner');
          newParams.delete('source');
          router.replace(`${pathname}?${newParams.toString()}`);
        }
      }
    }
  };

  const handleRemoveLearner = (learnerId: number) => {
    setSelectedLearnerId(learnerId);
    setRemoveModalOpen(true);
  };



  const handleConfirmRemove = async () => {
    if (!selectedLearnerId) {
      return;
    }

    if (selectedTeam === "all") {
      toast({
        title: "Error",
        description: "Please select a specific team from the dropdown to remove learners from.",
        variant: "destructive",
      });
      return;
    }

    const teamId = parseInt(selectedTeam);
    
    try {
      const result = await removeLearner({ teamId, userId: selectedLearnerId }).unwrap();
      toast({
        title: "Success",
        description: result.message || "Learner removed from team successfully.",
      });
      setRemoveModalOpen(false);
      setSelectedLearnerId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to remove learner from team.",
        variant: "destructive",
      });
    }
  };


  const handleAddLearners = async () => {
    if (selectedTeam === "all") {
      toast({
        title: "Error",
        description: "Please select a specific team to add learners to.",
        variant: "destructive",
      });
      return;
    }

    if (selectedUserIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one learner to add.",
        variant: "destructive",
      });
      return;
    }

    const teamId = parseInt(selectedTeam);
    
    try {
      const result = await addLearners({ teamId, request: { user_ids: selectedUserIds } }).unwrap();
      toast({
        title: "Success",
        description: result.message || `${selectedUserIds.length} learner(s) added to team successfully.`,
      });
      setAddModalOpen(false);
      setSelectedUserIds([]);
      setUserSearchQuery("");
      setUserPage(1);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to add learners to team.",
        variant: "destructive",
      });
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const loadMoreUsers = () => {
    if (usersData && userPage < usersData.total_pages) {
      setUserPage(prev => prev + 1);
    }
  };

  // Filter out already selected users from the list
  const filteredUsers = users.filter(user => selectedUserIds.includes(user.ID) || !selectedUserIds.includes(user.ID));
  
  // Sort: selected users first
  const sortedUsers = [
    ...filteredUsers.filter(u => selectedUserIds.includes(u.ID)),
    ...filteredUsers.filter(u => !selectedUserIds.includes(u.ID))
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Manage Teams/ Learners</h1>
        <Button 
          className="bg-[#00B140] hover:bg-[#00B140]/90"
          onClick={() => setAddModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Learner
        </Button>
      </div>

      {/* Course Assignments Section */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Courses Assigned to Teams</h2>
            <p className="text-sm text-muted-foreground">Active course assignments across all teams</p>
          </div>

          {teamsLoading ? (
            <div className=" grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courseAssignments.slice(0, 5).map((assignment, idx) => (
                <div key={idx} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <h3 className="font-medium text-foreground">{assignment.course_title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{assignment.team_name}</p>
                  <p className="text-sm text-muted-foreground">{assignment.learner_count} learners</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id.toString()}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Learners Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground uppercase">
                    User
                  </th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground uppercase">
                    Teams
                  </th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground uppercase">
                    Courses
                  </th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {learnersLoading || isFetching ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-4">
                        <Skeleton className="h-12 w-64" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-12" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-12" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-8 w-24" />
                      </td>
                    </tr>
                  ))
                ) : learners.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-muted-foreground">
                      No learners found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  learners.map((learner) => (
                    <tr key={learner.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={learner.avatar_url} alt={learner.name} />
                            <AvatarFallback className="bg-[#00B140] text-white">
                              {learner.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">{learner.name}</div>
                            <div className="text-sm text-muted-foreground">{learner.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-foreground">{learner.team_count}</td>
                      <td className="p-4 text-foreground">{learner.course_count}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-[#00B140] hover:text-[#00B140]/80"
                            onClick={() => handleViewLearner(learner.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive/80"
                            onClick={() => handleRemoveLearner(learner.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Learner Modal */}
      <Dialog open={viewModalOpen} onOpenChange={handleViewModalOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Learner Details</DialogTitle>
          </DialogHeader>
          {learnerDetailsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            </div>
          ) : learnerDetails ? (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={learnerDetails.learner.avatar_url} />
                  <AvatarFallback className="bg-[#00B140] text-white text-2xl">
                    {learnerDetails.learner.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{learnerDetails.learner.name}</h3>
                  <p className="text-muted-foreground">{learnerDetails.learner.email}</p>
                  {learnerDetails.learner.phone && (
                    <p className="text-sm text-muted-foreground">{learnerDetails.learner.phone}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {learnerDetails.learner.teams.map((team, idx) => (
                      <Badge key={idx} variant="secondary">{team}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{learnerDetails.stats.total_courses}</div>
                  <div className="text-sm text-muted-foreground">Total Courses</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{learnerDetails.stats.completed}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{learnerDetails.stats.in_progress}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{learnerDetails.stats.certificates}</div>
                  <div className="text-sm text-muted-foreground">Certificates</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Recent Enrollments</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {learnerDetails.enrollments.map((enrollment) => (
                    <div key={enrollment.course_id} className="flex justify-between items-center p-2 border rounded">
                      <span className="font-medium">{enrollment.course_title}</span>
                      <span className="text-sm text-muted-foreground">
                        {enrollment.last_active || "No activity"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p>Learner details not found.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Modal */}
      <Dialog open={removeModalOpen} onOpenChange={setRemoveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Learner</DialogTitle>
            <DialogDescription>
              {selectedTeam === "all" 
                ? "Please select a specific team first to remove learners from."
                : "Are you sure you want to remove this learner from the selected team? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmRemove}
              disabled={selectedTeam === "all"}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Learner Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Learners to Team</DialogTitle>
            <DialogDescription>
              {selectedTeam === "all" 
                ? "Please select a specific team first to add learners."
                : `Select learners to add to ${teams.find(t => t.id.toString() === selectedTeam)?.name}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTeam !== "all" && (
            <>
              <div className="space-y-4">
                {/* Selected users count */}
                {selectedUserIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{selectedUserIds.length} selected</Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedUserIds([])}
                    >
                      Clear all
                    </Button>
                  </div>
                )}

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search users by name..."
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      setUserPage(1);
                    }}
                    className="pl-10"
                  />
                </div>

                {/* Users list with infinite scroll */}
                <ScrollArea className="h-96 border rounded-lg">
                  <div className="p-4 space-y-2">
                    {usersLoading && userPage === 1 ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <Skeleton key={idx} className="h-16" />
                      ))
                    ) : sortedUsers.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No users found.</p>
                    ) : (
                      <>
                        {sortedUsers.map((user) => (
                          <div
                            key={user.ID}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedUserIds.includes(user.ID)
                                ? "bg-[#00B140]/10 border-[#00B140]"
                                : "hover:bg-accent"
                            }`}
                            onClick={() => toggleUserSelection(user.ID)}
                          >
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback className="bg-[#00B140] text-white">
                                {user.display_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="font-medium">{user.display_name}</div>
                              <div className="text-sm text-muted-foreground">{user.user_email}</div>
                            </div>
                            {selectedUserIds.includes(user.ID) && (
                              <Badge className="bg-[#00B140]">Selected</Badge>
                            )}
                          </div>
                        ))}
                        
                        {usersData && userPage < usersData.total_pages && (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={loadMoreUsers}
                            disabled={usersLoading}
                          >
                            {usersLoading ? "Loading..." : "Load More"}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddLearners}
                  disabled={selectedUserIds.length === 0}
                  className="bg-[#00B140] hover:bg-[#00B140]/90"
                >
                  Add {selectedUserIds.length > 0 && `(${selectedUserIds.length})`}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
