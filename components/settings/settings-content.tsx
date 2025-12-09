"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { BookOpen, Shield, Settings } from "lucide-react";
import GeneralSettings from "./general-settings";
import CourseSettings from "./course-settings";
import SecuritySettings from "./security-settings";

export default function SettingsContent() {
  return (
    <div className="p-6 lg:p-8 space-y-6 bg-transparent">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Setting</h1>
        <p className="text-muted-foreground mt-1">
          Configure platform settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <div className="border-b border-border px-6 pt-6">
          <TabsList className="h-auto p-0 bg-transparent gap-6">
            <TabsTrigger
              value="general"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-b-[#16a34a] data-[state=active]:text-[#16a34a] rounded-none pb-3 px-0 font-medium"
            >
              <Settings className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger
              value="course"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-b-[#16a34a] data-[state=active]:text-[#16a34a] rounded-none pb-3 px-0 font-medium"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Course Settings
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-b-[#16a34a] data-[state=active]:text-[#16a34a] rounded-none pb-3 px-0 font-medium"
            >
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>
        </div>
        <Card className="border border-border mt-4">
          <div className="p-6">
            <TabsContent value="general" className="mt-0">
              <GeneralSettings />
            </TabsContent>
            <TabsContent value="course" className="mt-0">
              <CourseSettings />
            </TabsContent>
            <TabsContent value="security" className="mt-0">
              <SecuritySettings />
            </TabsContent>
          </div>
        </Card>
      </Tabs>
    </div>
  );
}
