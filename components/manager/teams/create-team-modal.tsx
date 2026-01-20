"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BookOpen, X, Plus, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateTeamMutation } from "@/lib/store/api/teamApi";
import SelectLearnersModal from "./select-learners-modal";
import SelectFacilitatorsModal from "./select-facilitators-modal";
import SelectCoursesModal from "./select-courses-modal";

interface CreateTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Learner {
  id: number;
  name: string;
  email: string;
}

interface Course {
  id: number;
  name: string;
  progress: number;
}

interface Facilitator {
  id: number;
  name: string;
  email: string;
  initials?: string;
  organization?: string;
}

const TABS = ["details", "facilitator", "learners", "courses"] as const;
type TabValue = typeof TABS[number];

export default function CreateTeamModal({ open, onOpenChange }: CreateTeamModalProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("details");
  const [teamName, setTeamName] = useState("");
  const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isSelectLearnersOpen, setIsSelectLearnersOpen] = useState(false);
  const [isSelectFacilitatorsOpen, setIsSelectFacilitatorsOpen] = useState(false);
  const [isSelectCoursesOpen, setIsSelectCoursesOpen] = useState(false);
  const [errors, setErrors] = useState<{ teamName?: string }>({});
  const { toast } = useToast();

  const [createTeam, { isLoading }] = useCreateTeamMutation();

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setActiveTab("details");
      setTeamName("");
      setFacilitators([]);
      setLearners([]);
      setCourses([]);
      setErrors({});
    }
  }, [open]);

  const currentTabIndex = TABS.indexOf(activeTab);
  const isLastTab = currentTabIndex === TABS.length - 1;

  const validateForm = (): boolean => {
    const newErrors: { teamName?: string } = {};
    
    if (!teamName.trim()) {
      newErrors.teamName = "Team name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    // Validate on Team Details tab before proceeding
    if (activeTab === "details") {
      if (!validateForm()) {
        return;
      }
    }
    
    if (!isLastTab) {
      setActiveTab(TABS[currentTabIndex + 1]);
    }
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      setActiveTab("details");
      return;
    }

    try {
      await createTeam({
        name: teamName,
        facilitator_ids: facilitators.map(f => f.id),
        learner_ids: learners.map(l => l.id),
        course_ids: courses.map(c => c.id),
      }).unwrap();

      toast({
        title: "Team created",
        description: "The team has been successfully created.",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create team. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeFacilitator = (facilitatorId: number) => {
    setFacilitators(facilitators.filter(f => f.id !== facilitatorId));
  };

  const removeLearner = (learnerId: number) => {
    setLearners(learners.filter(l => l.id !== learnerId));
  };

  const removeCourse = (courseId: number) => {
    setCourses(courses.filter(c => c.id !== courseId));
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleAddFacilitators = (selectedFacilitators: Facilitator[]) => {
    setFacilitators(prev => [...prev, ...selectedFacilitators]);
  };

  const handleAddLearners = (selectedLearners: Learner[]) => {
    setLearners(prev => [...prev, ...selectedLearners]);
  };

  const handleAddCourses = (selectedCourses: Course[]) => {
    setCourses(prev => [...prev, ...selectedCourses]);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[700px] p-0 gap-0" showCloseButton={false}>
          <DialogHeader className="px-6 pt-6 pb-4 flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Create Team</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-gray-600"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabValue)} className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 px-6 gap-1">
              <TabsTrigger
                value="details"
                className="rounded-none border-b-2 px-4 py-3 gap-2 data-[state=active]:border-b-[#00B140] data-[state=active]:text-[#00B140] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=inactive]:border-b-transparent border-b-transparent text-gray-500 font-medium bg-transparent shadow-none focus:ring-0 focus:outline-none"
              >
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs">○</span>
                Team Details
              </TabsTrigger>
              <TabsTrigger
                value="facilitator"
                className="rounded-none border-b-2 px-4 py-3 gap-2 data-[state=active]:border-b-[#00B140] data-[state=active]:text-[#00B140] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=inactive]:border-b-transparent border-b-transparent text-gray-500 font-medium bg-transparent shadow-none focus:ring-0 focus:outline-none"
              >
                <User className="w-4 h-4" />
                Facilitator ({facilitators.length})
              </TabsTrigger>
              <TabsTrigger
                value="learners"
                className="rounded-none border-b-2 px-4 py-3 gap-2 data-[state=active]:border-b-[#00B140] data-[state=active]:text-[#00B140] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=inactive]:border-b-transparent border-b-transparent text-gray-500 font-medium bg-transparent shadow-none focus:ring-0 focus:outline-none"
              >
                <Users className="w-4 h-4" />
                Learners ({learners.length})
              </TabsTrigger>
              <TabsTrigger
                value="courses"
                className="rounded-none border-b-2 px-4 py-3 gap-2 data-[state=active]:border-b-[#00B140] data-[state=active]:text-[#00B140] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=inactive]:border-b-transparent border-b-transparent text-gray-500 font-medium bg-transparent shadow-none focus:ring-0 focus:outline-none"
              >
                <BookOpen className="w-4 h-4" />
                Courses ({courses.length})
              </TabsTrigger>
            </TabsList>

            {/* Team Details Tab */}
            <TabsContent value="details" className="px-6 py-6 mt-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    value={teamName}
                    onChange={(e) => {
                      setTeamName(e.target.value);
                      if (errors.teamName) {
                        setErrors({});
                      }
                    }}
                    placeholder="Enter team name"
                    className={`h-11 ${errors.teamName ? "border-red-500" : ""}`}
                  />
                  {errors.teamName && (
                    <p className="text-sm text-red-500">{errors.teamName}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Facilitator Tab */}
            <TabsContent value="facilitator" className="px-6 py-6 mt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Manage Facilitators</h3>
                  <Button 
                    className="bg-[#00B140] hover:bg-[#00B140]/90 text-white"
                    onClick={() => setIsSelectFacilitatorsOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Facilitators
                  </Button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {facilitators.length > 0 ? (
                    facilitators.map((facilitator) => (
                      <div
                        key={facilitator.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 bg-[#00B140]">
                            <AvatarFallback className="text-white bg-[#00B140] font-semibold text-sm">
                              {getInitials(facilitator.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-[#1a1a1a]">{facilitator.name}</div>
                            <div className="text-xs text-gray-500">{facilitator.email || facilitator.organization}</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-gray-600"
                          onClick={() => removeFacilitator(facilitator.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No facilitators added yet. Click "Add Facilitators" to add.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Learners Tab */}
            <TabsContent value="learners" className="px-6 py-6 mt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Manage Learners</h3>
                  <Button 
                    className="bg-[#00B140] hover:bg-[#00B140]/90 text-white"
                    onClick={() => setIsSelectLearnersOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Learners
                  </Button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {learners.length > 0 ? (
                    learners.map((learner) => (
                      <div
                        key={learner.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 bg-[#00B140]">
                            <AvatarFallback className="text-white bg-[#00B140] font-semibold text-sm">
                              {getInitials(learner.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-[#1a1a1a]">{learner.name}</div>
                            <div className="text-xs text-gray-500">{learner.email}</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-gray-600"
                          onClick={() => removeLearner(learner.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No learners added yet. Click "Add Learners" to add.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses" className="px-6 py-6 mt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Manage Courses</h3>
                  <Button 
                    className="bg-[#00B140] hover:bg-[#00B140]/90 text-white"
                    onClick={() => setIsSelectCoursesOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Courses
                  </Button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-[#00B140] rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-[#1a1a1a] mb-1">{course.name}</div>
                            <div className="flex items-center gap-2">
                              <Progress value={course.progress} className="h-2 flex-1 bg-gray-200 [&>div]:bg-[#2563EB]" />
                              <span className="text-sm text-gray-500 w-10 text-right">{course.progress}%</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-gray-600 ml-2"
                          onClick={() => removeCourse(course.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No courses assigned yet.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={handleClose}
            >
              Cancel
            </Button>
            {isLastTab ? (
              <Button
                className="flex-1 h-11 bg-[#00B140] hover:bg-[#00B140]/90 text-white"
                onClick={handleCreate}
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Team"}
              </Button>
            ) : (
              <Button
                className="flex-1 h-11 bg-[#00B140] hover:bg-[#00B140]/90 text-white"
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SelectFacilitatorsModal
        open={isSelectFacilitatorsOpen}
        onOpenChange={setIsSelectFacilitatorsOpen}
        onSelect={handleAddFacilitators}
        existingFacilitatorIds={facilitators.map(f => f.id)}
      />

      <SelectLearnersModal
        open={isSelectLearnersOpen}
        onOpenChange={setIsSelectLearnersOpen}
        onSelect={handleAddLearners}
        existingLearnerIds={learners.map(l => l.id)}
      />

      <SelectCoursesModal
        open={isSelectCoursesOpen}
        onOpenChange={setIsSelectCoursesOpen}
        onSelect={handleAddCourses}
        existingCourseIds={courses.map(c => c.id)}
      />
    </>
  );
}
