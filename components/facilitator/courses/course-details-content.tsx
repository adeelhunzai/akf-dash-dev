"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useGetFacilitatorCourseDetailsQuery } from "@/lib/store/api/userApi";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

interface CourseDetailsContentProps {
  courseId: string;
}

export default function CourseDetailsContent({ courseId }: CourseDetailsContentProps) {
  const locale = useLocale();
  const courseIdNum = parseInt(courseId);

  // Fetch course details from API
  const { data, isLoading, isError } = useGetFacilitatorCourseDetailsQuery(courseIdNum);

  const course = data?.data?.course;
  const learners = data?.data?.learners || [];

  // Helper function to clean WordPress shortcodes and HTML comments from description
  const cleanDescription = (html: string): string => {
    if (!html) return "No description available.";
    
    // Remove HTML comments
    let cleaned = html.replace(/<!--[\s\S]*?-->/g, '');
    
    // Remove WordPress/Divi shortcodes
    cleaned = cleaned.replace(/\[.*?\]/g, '');
    
    // Remove extra whitespace
    cleaned = cleaned.trim();
    
    // If empty after cleaning, return fallback
    if (!cleaned || cleaned.length < 10) {
      return "No description available.";
    }
    
    return cleaned;
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] bg-white rounded-lg border border-gray-200 m-4">
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="p-6">
        <p className="text-destructive mb-4">Course not found or failed to load.</p>
        <Link href={`/${locale}/facilitator/courses`} className="text-[#00B140] hover:underline inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to courses
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] bg-white rounded-lg border border-gray-200 m-4">
      {/* Back Link */}
      <Link 
        href={`/${locale}/facilitator/courses`} 
        className="text-[#00B140] hover:underline inline-flex items-center gap-2 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to courses
      </Link>

      {/* Course Header Card */}
      <Card className="border-gray-200">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-3">{course.title}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-4">
                <span>{course.groups.join(", ")}</span>
                <span className="text-muted-foreground/50">•</span>
                <span>
                  {course.start_date} {course.end_date ? `- ${course.end_date}` : ""}
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span>{course.duration}</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {cleanDescription(course.description)}
              </p>
            </div>
            
            {/* Completion Badge */}
            <div className="flex-shrink-0">
              <div className="w-28 h-28 rounded-full bg-[#D4F4E6] flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-[#00B140]">{course.completion_rate}%</div>
                <div className="text-sm text-[#00B140]">Complete</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div>
        <div className="border-b border-gray-200">
          <div className="flex">
            <button className="px-6 py-3 text-[#00B140] font-medium border-b-2 border-[#00B140]">
              Overview
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none bg-[#D4F4E6]">
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {course.total_learners}
                </div>
                <div className="text-sm text-muted-foreground">Total Learners</div>
              </CardContent>
            </Card>

            <Card className="border-none bg-[#F3E8F5]">
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {course.active_learners}
                </div>
                <div className="text-sm text-muted-foreground">Active Learners</div>
              </CardContent>
            </Card>

            <Card className="border-none bg-[#E3F2FD]">
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {course.certificates_issued}
                </div>
                <div className="text-sm text-muted-foreground">Certificates Issued</div>
              </CardContent>
            </Card>
          </div>

          {/* Learners Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Learners</h2>

            <Card className="border-gray-200">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-6 font-medium text-sm text-muted-foreground">
                          Learner
                        </th>
                        <th className="text-left p-6 font-medium text-sm text-muted-foreground">
                          Progress
                        </th>
                        <th className="text-left p-6 font-medium text-sm text-muted-foreground">
                          Enrolled
                        </th>
                        <th className="text-left p-6 font-medium text-sm text-muted-foreground">
                          Last Active
                        </th>
                        <th className="text-left p-6 font-medium text-sm text-muted-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {learners.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-muted-foreground">
                            No learners enrolled in this course yet.
                          </td>
                        </tr>
                      ) : (
                        learners.map((learner, index) => (
                          <tr
                            key={learner.id}
                            className={index !== learners.length - 1 ? "border-b border-gray-100" : ""}
                          >
                            <td className="p-6">
                              <div className="flex items-center gap-4">
                                <Avatar className="w-12 h-12">
                                  <AvatarImage src={learner.avatar_url} alt={learner.name} />
                                  <AvatarFallback className="bg-[#00B140] text-white font-semibold text-lg">
                                    {learner.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-foreground text-base">{learner.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {learner.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                                  <div 
                                    className="bg-[#00B140] h-2 rounded-full" 
                                    style={{ width: `${learner.progress}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{learner.progress}%</span>
                              </div>
                            </td>
                            <td className="p-6">
                              <span className="text-[#00B140] text-sm font-medium">on:</span>{" "}
                              <span className="text-foreground text-sm">{learner.enrolled_date}</span>
                            </td>
                            <td className="p-6">
                              <span className="text-[#00B140] text-sm font-medium">on:</span>{" "}
                              <span className="text-foreground text-sm">{learner.last_active}</span>
                            </td>
                            <td className="p-6">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                learner.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {learner.status === 'completed' ? 'Completed' : 'In Progress'}
                              </span>
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
      </div>
    </div>
  );
}
