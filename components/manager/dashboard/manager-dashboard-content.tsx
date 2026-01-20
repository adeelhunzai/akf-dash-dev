"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Users2, GraduationCap, Plus, UserPlus, Eye } from "lucide-react";
import { useGetManagerDashboardQuery } from "@/lib/store/api/managerApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { useLocale } from "next-intl";
import CreateTeamModal from "@/components/manager/teams/create-team-modal";
import ManagerAddFacilitatorDialog from "@/components/manager/facilitators/manager-add-facilitator-dialog";

interface Facilitator {
  id: number;
  name: string;
  email: string;
  initials: string;
  color: string;
  teams_count: number;
  learners_count: number;
}

interface DashboardStats {
  facilitators_count: number;
  teams_count: number;
  learners_count: number;
}

interface DashboardData {
  summary: DashboardStats;
  facilitators: Facilitator[];
}

export default function ManagerDashboardContent() {
  const locale = useLocale();
  const { data: dashboardData, isLoading, isFetching } = useGetManagerDashboardQuery();
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [addFacilitatorOpen, setAddFacilitatorOpen] = useState(false);

  const summary = dashboardData?.data?.summary;
  const facilitators = dashboardData?.data?.facilitators || [];

  const stats = [
    {
      label: "Facilitators",
      value: summary?.facilitators_count?.toString() || "0",
      icon: Users,
      iconBg: "bg-[#FDC300]",
    },
    {
      label: "Teams",
      value: summary?.teams_count?.toString() || "0",
      icon: Users2,
      iconBg: "bg-[#00B140]",
    },
    {
      label: "Learners",
      value: summary?.learners_count?.toString() || "0",
      icon: GraduationCap,
      iconBg: "bg-[#FDC300]",
    },
  ];

  // Color palette for facilitator avatars
  const avatarColors = ["bg-[#00B140]", "bg-[#FDC300]", "bg-[#E85D04]", "bg-[#9D4EDD]"];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Dashboard Overview
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {isLoading || isFetching ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="border border-gray-200">
              <CardContent className="p-5">
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border border-gray-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-lg ${stat.iconBg} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Quick Actions */}
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-1">Quick Actions</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Frequently used operations
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => setCreateTeamOpen(true)}
              className="h-auto py-4 px-6 bg-[#00B140] hover:bg-[#00B140]/90 text-white flex flex-col items-start justify-center gap-1"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Create New Team</span>
              </div>
              <span className="text-xs opacity-80 ml-7">
                Set up a new team with facilitators
              </span>
            </Button>
            <Button
              onClick={() => setAddFacilitatorOpen(true)}
              variant="outline"
              className="h-auto py-4 px-6 border-[#FDC300] bg-[#FDC300]/10 hover:bg-[#FDC300]/20 text-[#B8860B] flex flex-col items-start justify-center gap-1"
            >
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <span className="font-semibold">Add Facilitator</span>
              </div>
              <span className="text-xs opacity-80 ml-7">
                Invite or assign a new facilitator
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Facilitator Overview */}
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Facilitator Overview</h2>
              <p className="text-sm text-muted-foreground">
                Active facilitators and their teams
              </p>
            </div>
            <Link
              href={`/${locale}/manager/facilitators`}
              className="text-sm text-[#00B140] hover:underline font-medium"
            >
              View All
            </Link>
          </div>

          {isLoading || isFetching ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-16" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {facilitators.slice(0, 5).map((facilitator, index) => (
                <div
                  key={facilitator.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className={`w-10 h-10 ${avatarColors[index % avatarColors.length]}`}>
                      <AvatarFallback className="text-white text-sm font-medium bg-transparent">
                        {facilitator.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        {facilitator.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {facilitator.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {facilitator.teams_count} teams · {facilitator.learners_count} learners
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Eye className="w-5 h-5" />
                  </Button>
                </div>
              ))}
              {facilitators.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No facilitators found
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Modals */}
      <CreateTeamModal open={createTeamOpen} onOpenChange={setCreateTeamOpen} />
      <ManagerAddFacilitatorDialog open={addFacilitatorOpen} onOpenChange={setAddFacilitatorOpen} />
    </div>
  );
}
