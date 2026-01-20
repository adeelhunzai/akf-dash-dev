"use client";

import { useGetLearnerDetailsQuery } from "@/lib/store/api/managerApi";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Calendar, CheckCircle2, XCircle, Clock, AlertCircle, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LearnerDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learner: any; // Using any for now, ideally interface this
}

export default function LearnerDetailsModal({ open, onOpenChange, learner }: LearnerDetailsModalProps) {
  if (!learner) return null;

  // Fetch detailed data
  const { data: apiData, isLoading } = useGetLearnerDetailsQuery(learner?.id, {
    skip: !learner?.id || !open,
  });

  const fullData = apiData?.data;

  // Use API data if available, otherwise fallback (or show loading skeleton if we implemented one)
  // For now we map API response to the structure expected by UI
  
  const details = fullData?.details || {
    email: learner?.email || "-",
    phone: "-",
    location: "-",
    joinDate: "-",
    lastActive: "-",
    assignments: { completed: 0, total: 0 },
    quizzes: { passed: 0, total: 0 },
  };

  const activityLog = fullData?.activity_log || [];

  // If still loading and open, maybe show skeleton? 
  // For now let's just proceed, the values will update when data arrives.


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[1000px] p-0 gap-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-white p-6 border-b border-gray-100 flex items-start justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <Avatar className={`w-12 h-12 ${learner.color || 'bg-[#00B140]'}`}>
              <AvatarFallback className="text-white font-medium text-lg">
                {learner.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3">
                <DialogTitle className="text-xl font-bold text-[#1a1a1a]">{learner.name}</DialogTitle>
                <Badge variant="secondary" className="bg-red-50 text-red-600 border border-red-100 font-normal">
                  Critical Performance
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">{details.email}</p>
            </div>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </DialogClose>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Overall Score */}
            <div className="bg-[#FECACA] rounded-xl p-4 border border-red-100 relative">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-semibold text-red-900">Overall Score</span>
                <span className="text-red-400">
                   {/* Icon placeholder */}
                   <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 11L6 2L11 11H1Z" fill="current"/></svg>
                </span>
              </div>
              <div className="text-3xl font-bold text-red-600">{fullData?.score ?? learner.score}%</div>
              <p className="text-xs text-red-500 mt-1 font-medium">Below threshold</p>
            </div>
            
            {/* Progress */}
            <div className="bg-[#FDE68A] rounded-xl p-4 border border-yellow-100">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-semibold text-yellow-900">Progress</span>
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="text-3xl font-bold text-yellow-700">
                {fullData ? Math.round((fullData.courses_completed / fullData.courses_total) * 100) : 0}%
              </div>
              <p className="text-xs text-yellow-600 mt-1 font-medium">Course completion</p>
            </div>



             {/* Courses */}
             <div className="bg-[#E9D5FF] rounded-xl p-4 border border-purple-100">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-semibold text-purple-900">Courses</span>
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-700">{fullData?.courses_completed ?? 0}/{fullData?.courses_total ?? 1}</div>
              <p className="text-xs text-purple-600 mt-1 font-medium">Completed</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="bg-[#F9FAFB] rounded-xl p-6 border border-gray-100 shadow-sm">
                 <div className="flex items-center gap-2 mb-6">
                    <span className="w-4 h-4 text-[#00B140]"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                    <h3 className="font-bold text-[#1a1a1a]">Contact Information</h3>
                 </div>
                 <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase">Email</p>
                            <p className="text-sm text-[#1a1a1a]">{details.email}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase">Phone</p>
                            <p className="text-sm text-[#1a1a1a]">{details.phone}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase">Location</p>
                            <p className="text-sm text-[#1a1a1a]">{details.location}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase">Join Date</p>
                            <p className="text-sm text-[#1a1a1a]">{details.joinDate}</p>
                        </div>
                    </div>
                 </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-[#F9FAFB] rounded-xl p-6 border border-gray-100 shadow-sm">
                 <div className="flex items-center gap-2 mb-6">
                    <span className="w-4 h-4 text-[#00B140]"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></span>
                    <h3 className="font-bold text-[#1a1a1a]">Performance Metrics</h3>
                 </div>
                 <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-medium text-gray-600">Assignments Submitted</span>
                            <span className="text-sm font-bold text-[#1a1a1a]">{details.assignments.completed}/{details.assignments.total}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#00B140]" style={{ width: `${(details.assignments.completed/details.assignments.total)*100}%`}}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-medium text-gray-600">Quizzes Passed</span>
                            <span className="text-sm font-bold text-[#1a1a1a]">{details.quizzes.passed}/{details.quizzes.total}</span>
                        </div>
                         <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600" style={{ width: `${(details.quizzes.passed/details.quizzes.total)*100}%`}}></div>
                        </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
               {/* Team & Facilitator */}
              <div className="bg-[#F9FAFB] rounded-xl p-6 border border-gray-100 shadow-sm">
                 <div className="flex items-center gap-2 mb-6">
                    <span className="w-4 h-4 text-[#00B140]"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
                    <h3 className="font-bold text-[#1a1a1a]">Team & Facilitator</h3>
                 </div>
                  <div className="space-y-4">
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase">Team</p>
                        <p className="text-sm text-[#1a1a1a] font-semibold">{fullData?.team || learner.team || "Unassigned"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase">Department</p>
                        <p className="text-sm text-[#1a1a1a] font-semibold">{fullData?.department || learner.department}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase">Facilitator</p>
                        <p className="text-sm text-[#1a1a1a] font-semibold">{fullData?.facilitator || learner.facilitator || "Unassigned"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase">Last Active</p>
                        <p className="text-sm text-[#1a1a1a] font-semibold">{details.lastActive}</p>
                    </div>
                 </div>
              </div>

               {/* Recent Activity */}
               <div className="bg-[#F9FAFB] rounded-xl p-6 border border-gray-100 shadow-sm">
                 <div className="flex items-center gap-2 mb-6">
                    <span className="w-4 h-4 text-[#00B140]"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
                    <h3 className="font-bold text-[#1a1a1a]">Recent Activity</h3>
                 </div>
                 <div className="space-y-6">
                    {activityLog.map((activity: any, idx: number) => {
                        let Icon = FileText;
                        if (activity.type.includes('quiz')) Icon = activity.status === 'passed' ? CheckCircle2 : XCircle;
                        if (activity.type === 'deadline') Icon = AlertCircle;
                        
                        return (
                            <div key={idx} className="flex gap-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activity.color}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#1a1a1a]">{activity.title}</h4>
                                    <p className="text-xs text-gray-500">{activity.course}</p>
                                    {activity.detail && <p className="text-xs text-red-500 font-medium">{activity.detail}</p>}
                                    <p className="text-xs text-gray-400 mt-1">{activity.date}</p>
                                </div>
                            </div>
                        );
                    })}
                 </div>
              </div>
            </div>
          </div>
        </div>


      </DialogContent>
    </Dialog>
  );
}
