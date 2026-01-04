"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useGetFacilitatorLearnerDetailsQuery } from "@/lib/store/api/userApi";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

interface LearnerDetailsContentProps {
  learnerId: string;
}

export default function LearnerDetailsContent({ learnerId }: LearnerDetailsContentProps) {
  const locale = useLocale();
  const learnerIdNum = parseInt(learnerId);

  const { data, isLoading, isError } = useGetFacilitatorLearnerDetailsQuery(learnerIdNum);

  const learner = data?.data?.learner;
  const stats = data?.data?.stats;
  const enrollments = data?.data?.enrollments || [];

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !learner) {
    return (
      <div className="p-6">
        <p className="text-destructive mb-4">Learner not found or access denied.</p>
        <Link href={`/${locale}/facilitator/teams`} className="text-[#00B140] hover:underline inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Learners
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Back Link */}
      <Link 
        href={`/${locale}/facilitator/teams`} 
        className="text-[#00B140] hover:underline inline-flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Learners
      </Link>

      {/* Learner Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={learner.avatar_url} alt={learner.name} />
              <AvatarFallback className="bg-[#00B140] text-white text-3xl">
                {learner.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">{learner.name}</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Email:</span> {learner.email}
                </div>
                {learner.phone && (
                  <div>
                    <span className="font-medium">Phone:</span> {learner.phone}
                  </div>
                )}
                <div>
                  <span className="font-medium">Teams:</span> {learner.teams.join(", ")}
                </div>
                {learner.position && (
                  <div>
                    <span className="font-medium">Position:</span> {learner.position}
                  </div>
                )}
                <div>
                  <span className="font-medium">Joined:</span> {learner.joined_date}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none bg-[#D4F4E6]">
          <CardContent className="p-6">
            <div className="text-4xl font-bold text-foreground mb-2">
              {stats?.total_courses || 0}
            </div>
            <div className="text-sm text-muted-foreground">Total Courses</div>
          </CardContent>
        </Card>

        <Card className="border-none bg-[#E8F5E9]">
          <CardContent className="p-6">
            <div className="text-4xl font-bold text-foreground mb-2">
              {stats?.completed || 0}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>

        <Card className="border-none bg-[#F3E8F5]">
          <CardContent className="p-6">
            <div className="text-4xl font-bold text-foreground mb-2">
              {stats?.in_progress || 0}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>

        <Card className="border-none bg-[#E3F2FD]">
          <CardContent className="p-6">
            <div className="text-4xl font-bold text-foreground mb-2">
              {stats?.certificates || 0}
            </div>
            <div className="text-sm text-muted-foreground">Certificates</div>
          </CardContent>
        </Card>
      </div>

      {/* Enrollments Tab */}
      <div>
        <div className="border-b border-gray-200 mb-6">
          <div className="flex">
            <button className="px-6 py-3 text-[#00B140] font-medium border-b-2 border-[#00B140]">
              Enrollments
            </button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium text-sm text-muted-foreground uppercase">
                      Course
                    </th>
                    <th className="text-left p-4 font-medium text-sm text-muted-foreground uppercase">
                      Enrolled
                    </th>
                    <th className="text-left p-4 font-medium text-sm text-muted-foreground uppercase">
                      Due Date
                    </th>
                    <th className="text-left p-4 font-medium text-sm text-muted-foreground uppercase">
                      Last Active
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-muted-foreground">
                        No enrollments found.
                      </td>
                    </tr>
                  ) : (
                    enrollments.map((enrollment) => (
                      <tr key={enrollment.course_id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-medium text-foreground">{enrollment.course_title}</td>
                        <td className="p-4 text-sm">
                          <span className="text-[#00B140] font-medium">on:</span>{" "}
                          <span className="text-foreground">{enrollment.enrolled_date || "N/A"}</span>
                        </td>
                        <td className="p-4 text-sm">
                          <span className="text-[#00B140] font-medium">on:</span>{" "}
                          <span className="text-foreground">{enrollment.due_date || "N/A"}</span>
                        </td>
                        <td className="p-4 text-sm">
                          <span className="text-[#00B140] font-medium">on:</span>{" "}
                          <span className="text-foreground">{enrollment.last_active || "Never"}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
