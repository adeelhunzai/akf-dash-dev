"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { X, Mail, Phone, MapPin, Award } from "lucide-react";
import { useGetUserDetailsQuery } from "@/lib/store/api/userApi";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

interface LearnerProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learnerId?: number;
}

export default function LearnerProfileModal({ open, onOpenChange, learnerId }: LearnerProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "courses">("overview");

  // Fetch user details from API
  const { data: userDetails, isLoading, isError } = useGetUserDetailsQuery(learnerId!, {
    skip: !learnerId || !open,
  });

  if (!learnerId) return null;

  // Helper to get initials
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = userDetails ? getInitials(userDetails.display_name) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[700px] p-0 gap-0 overflow-hidden bg-white max-h-[85vh] flex flex-col">
        {/* Visually hidden title for accessibility */}
        <VisuallyHidden.Root>
          <DialogTitle>Learner Profile</DialogTitle>
        </VisuallyHidden.Root>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          {isLoading ? (
            <div className="flex items-start gap-4 flex-1">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ) : userDetails ? (
            <div className="flex items-start gap-4 flex-1">
              <Avatar className="h-16 w-16 bg-[#00B140]">
                <AvatarFallback className="text-white text-2xl font-semibold bg-[#00B140]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#1a1a1a]">{userDetails.display_name}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {userDetails.user_email}
                  </span>
                  {userDetails.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {userDetails.phone}
                    </span>
                  )}
                  {userDetails.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {userDetails.location}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2 text-sm">
                  {userDetails.department && (
                    <Badge className="bg-[#00B140] text-white hover:bg-[#00B140]">
                      {userDetails.department}
                    </Badge>
                  )}
                  {userDetails.job_title && (
                    <span className="text-gray-600">{userDetails.job_title}</span>
                  )}
                  <span className="text-gray-500">
                    Joined {userDetails.join_date || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full -mt-2 -mr-2">
              <X className="w-5 h-5" />
            </Button>
          </DialogClose>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "overview"
                ? "text-[#00B140] border-[#00B140]"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("courses")}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "courses"
                ? "text-[#00B140] border-[#00B140]"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            Enrolled Course
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
          {isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
              </div>
              <Skeleton className="h-6 w-32 mt-6" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          ) : isError ? (
            <div className="text-center py-8">
              <p className="text-red-500">Failed to load learner details</p>
            </div>
          ) : userDetails ? (
            <>
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-3xl font-bold text-[#00B140]">{userDetails.total_courses || 0}</div>
                      <div className="text-sm text-[#00B140]">Course's Enrolled</div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-3xl font-bold text-[#00B140]">{userDetails.completed_courses || 0}</div>
                      <div className="text-sm text-[#00B140]">Course's Completed</div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-3xl font-bold text-[#00B140]">{userDetails.certificates_count || 0}</div>
                      <div className="text-sm text-[#00B140]">Certificates Earned</div>
                    </div>
                  </div>

                  {/* Certificates Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">Certificates</h3>
                    {userDetails.certificates && userDetails.certificates.length > 0 ? (
                      <div className="space-y-3">
                        {userDetails.certificates.map((cert: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg">
                            <div className="w-10 h-10 bg-[#E8F5E9] rounded-lg flex items-center justify-center">
                              <Award className="w-5 h-5 text-[#00B140]" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-[#1a1a1a]">{cert.title || cert.course_title}</h4>
                              <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                                <span>Issued: {cert.issued_date || cert.date}</span>
                                <Badge variant="outline" className="text-[#00B140] border-[#00B140] text-xs">
                                  {cert.type || 'Certificate'}
                                </Badge>
                                <span>ID: {cert.id || `CERT-${idx + 1}`}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : userDetails.completed_courses_details && userDetails.completed_courses_details.length > 0 ? (
                      <div className="space-y-3">
                        {userDetails.completed_courses_details.map((course: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg">
                            <div className="w-10 h-10 bg-[#E8F5E9] rounded-lg flex items-center justify-center">
                              <Award className="w-5 h-5 text-[#00B140]" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-[#1a1a1a]">{course.title}</h4>
                              <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                                <span>Completed: {course.completed_date || 'N/A'}</span>
                                <Badge variant="outline" className="text-[#00B140] border-[#00B140] text-xs">
                                  Certificate
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No certificates earned yet</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "courses" && (
                <div className="space-y-4">
                  {userDetails.enrolled_courses_details && userDetails.enrolled_courses_details.length > 0 ? (
                    userDetails.enrolled_courses_details.map((course: any) => (
                      <div key={course.id} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-[#1a1a1a]">{course.title}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <Badge 
                                variant="outline" 
                                className={course.progress === 100 
                                  ? "bg-[#00B140] text-white border-[#00B140] text-xs"
                                  : "bg-white text-[#00B140] border-[#00B140] text-xs"
                                }
                              >
                                {course.progress === 100 ? 'Completed' : 'In Progress'}
                              </Badge>
                              {course.completed_date && (
                                <span className="text-sm text-gray-500">Completed: {course.completed_date}</span>
                              )}
                              {course.grade && (
                                <span className="text-sm text-gray-500">Grade: {course.grade}</span>
                              )}
                            </div>
                          </div>
                          <button className="text-[#00B140] hover:text-[#009933] text-sm font-medium">
                            View Course
                          </button>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <Progress value={course.progress} className="h-2 flex-1" />
                          <span className="text-sm font-medium text-gray-600 w-12 text-right">{course.progress}%</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No courses enrolled</p>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
