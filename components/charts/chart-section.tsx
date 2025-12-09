"use client";

import CourseCompletionChart from "./course-completion-chart";
import CourseStatusChart from "./course-status-chart";
import TopCoursesChart from "./top-courses-chart";
import UserDistributionChart from "./user-distribution-chart";
import { Card } from "@/components/ui/card";

export default function ChartSection() {
  return (
    <div className="space-y-4">
      {/* Top Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-2 md:p-4">
          <h3 className="text-lg font-semibold mb-4">Course Completion Rate</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Completed vs In Progress
          </p>
          <CourseCompletionChart />
        </Card>
        <Card className="p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">
            Top 5 Most Popular Courses
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            By enrollment count
          </p>
          <TopCoursesChart />
        </Card>
      </div>

      {/* Bottom Charts Row */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">Course Status Distribution</h3>
          <p className="text-sm text-muted-foreground mb-6">Active vs Inactive courses</p>
          <CourseStatusChart />
        </Card>

        <Card className="p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">
            Global User Distribution
          </h3>
          <p className="text-sm text-muted-foreground mb-6">Users by region</p>
          <UserDistributionChart />
        </Card>
      </div> */}
    </div>
  );
}
