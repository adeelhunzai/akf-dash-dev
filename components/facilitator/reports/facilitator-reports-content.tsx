"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Users2, Award, Grid2x2 } from "lucide-react";
import { useGetFacilitatorReportsSummaryQuery } from "@/lib/store/api/userApi";
import { Skeleton } from "@/components/ui/skeleton";
import CourseReportsTab from "./course-reports-tab";
import LearnerReportsTab from "./learner-reports-tab";
import TeamReportsTab from "./team-reports-tab";

export default function FacilitatorReportsContent() {
  const { data: summaryData, isLoading: summaryLoading } = useGetFacilitatorReportsSummaryQuery();

  const summary = summaryData?.data;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold text-[#1a1a1a] mb-8">
        Reports
      </h1>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 min-h-[calc(100vh-200px)]">
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="bg-transparent border-b border-gray-200 w-full justify-start h-auto p-0 rounded-none">
            <TabsTrigger 
              value="courses" 
              className="flex-none border-b-2 border-transparent data-[state=active]:border-b-[#00B140] data-[state=active]:text-[#00B140] data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none px-6 py-3 text-gray-600 font-normal hover:text-[#00B140] transition-colors -mb-px"
            >
              <Grid2x2 className="w-4 h-4 mr-2" />
              Course Reports
            </TabsTrigger>
            <TabsTrigger 
              value="learners" 
              className="flex-none border-b-2 border-transparent data-[state=active]:border-b-[#00B140] data-[state=active]:text-[#00B140] data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none px-6 py-3 text-gray-600 font-normal hover:text-[#00B140] transition-colors -mb-px"
            >
              <Users className="w-4 h-4 mr-2" />
              Learner Reports
            </TabsTrigger>
            <TabsTrigger 
              value="teams" 
              className="flex-none border-b-2 border-transparent data-[state=active]:border-b-[#00B140] data-[state=active]:text-[#00B140] data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none px-6 py-3 text-gray-600 font-normal hover:text-[#00B140] transition-colors -mb-px"
            >
              <Users2 className="w-4 h-4 mr-2" />
              Team Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="mt-6">
            {/* Stats Section - Only for Course Reports */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card className="bg-white rounded-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Learners</p>
                      {summaryLoading ? (
                        <Skeleton className="h-8 w-20" />
                      ) : (
                        <div className="text-3xl font-bold">{summary?.total_learners || 0}</div>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-[#00B140] flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white rounded-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Number of Teams</p>
                      {summaryLoading ? (
                        <Skeleton className="h-8 w-20" />
                      ) : (
                        <div className="text-3xl font-bold">{summary?.total_teams || 0}</div>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-[#00B140] flex items-center justify-center flex-shrink-0">
                      <Users2 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white rounded-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Certificates Issued</p>
                      {summaryLoading ? (
                        <Skeleton className="h-8 w-20" />
                      ) : (
                        <div className="text-3xl font-bold">{summary?.certificates_issued || 0}</div>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-[#00B140] flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <CourseReportsTab />
          </TabsContent>

          <TabsContent value="learners" className="mt-6">
            <LearnerReportsTab />
          </TabsContent>

          <TabsContent value="teams" className="mt-6">
            <TeamReportsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
