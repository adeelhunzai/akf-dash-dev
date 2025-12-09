"use client";

import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Learner {
  id: string;
  name: string;
  email: string;
  courseEnrolled: string;
  progress: number;
  status: "active" | "completed";
  lastActivity: string;
}

const mockLearners: Learner[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    courseEnrolled: "React Development",
    progress: 85,
    status: "active",
    lastActivity: "2 hours ago",
  },
  {
    id: "2",
    name: "Mike Chen",
    email: "mike.chen@email.com",
    courseEnrolled: "JavaScript Basics",
    progress: 100,
    status: "completed",
    lastActivity: "1 day ago",
  },
  {
    id: "3",
    name: "Emma Davis",
    email: "emma.davis@email.com",
    courseEnrolled: "Node.js Fundamentals",
    progress: 60,
    status: "active",
    lastActivity: "5 hours ago",
  },
  {
    id: "4",
    name: "Alex Rodriguez",
    email: "alex.rodriguez@email.com",
    courseEnrolled: "Advanced JavaScript",
    progress: 45,
    status: "active",
    lastActivity: "1 hour ago",
  },
  {
    id: "5",
    name: "Lisa Wang",
    email: "lisa.wang@email.com",
    courseEnrolled: "React Development",
    progress: 100,
    status: "completed",
    lastActivity: "3 days ago",
  },
];

export function ManageLearnersContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredLearners = mockLearners.filter((learner) => {
    const matchesSearch =
      learner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      learner.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse =
      courseFilter === "all" || learner.courseEnrolled === courseFilter;
    const matchesStatus =
      statusFilter === "all" || learner.status === statusFilter;
    return matchesSearch && matchesCourse && matchesStatus;
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold text-[#1a1a1a] mb-8">
        Manage Learners
      </h1>

      {/* Filters Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 border-gray-300 focus:border-gray-400 focus:ring-0"
            />
          </div>

          {/* Course Filter */}
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-[200px] h-11 border-gray-300">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              <SelectItem value="React Development">React Development</SelectItem>
              <SelectItem value="JavaScript Basics">JavaScript Basics</SelectItem>
              <SelectItem value="Node.js Fundamentals">Node.js Fundamentals</SelectItem>
              <SelectItem value="Advanced JavaScript">Advanced JavaScript</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px] h-11 border-gray-300">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">
                Learner
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">
                Course Enrolled
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">
                Progress
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">
                Status
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">
                Last Activity
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLearners.map((learner, index) => (
              <tr
                key={learner.id}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  index === filteredLearners.length - 1 ? "border-b-0" : ""
                }`}
              >
                <td className="py-4 px-6">
                  <div>
                    <div className="font-medium text-[#1a1a1a]">
                      {learner.name}
                    </div>
                    <div className="text-sm text-gray-500">{learner.email}</div>
                  </div>
                </td>
                <td className="py-4 px-6 text-gray-700">
                  {learner.courseEnrolled}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-[120px] h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00B87C] rounded-full transition-all"
                        style={{ width: `${learner.progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 min-w-[40px]">
                      {learner.progress}%
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      learner.status === "active"
                        ? "bg-[#E8F9F3] text-[#00B87C]"
                        : "bg-[#E3F2FD] text-[#2196F3]"
                    }`}
                  >
                    {learner.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-gray-700">
                  {learner.lastActivity}
                </td>
                <td className="py-4 px-6">
                  <Button
                    variant="ghost"
                    className="text-[#00B87C] hover:text-[#00a06d] hover:bg-[#E8F9F3] font-medium text-sm h-auto py-1.5 px-3"
                  >
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
