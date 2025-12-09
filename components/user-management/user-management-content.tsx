"use client";

import { useState } from "react";
import { Search, Download, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UserTable from "./user-table";
import AddLearnerDialog from "./add-learner-dialog";
import AddFacilitatorDialog from "./add-facilitator-dialog";

export default function UserManagementContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isAddLearnerOpen, setIsAddLearnerOpen] = useState(false);
  const [isAddFacilitatorOpen, setIsAddFacilitatorOpen] = useState(false);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage learners, facilitators, and managers
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="border-[#16a34a] text-[#16a34a] hover:bg-green-50 bg-transparent"
            onClick={() => setIsAddLearnerOpen(true)}
          >
            <Users className="w-4 h-4 mr-2" />
            Add Learner
          </Button>
          <Button
            variant="outline"
            className="border-[#16a34a] text-[#16a34a] hover:bg-green-50 bg-transparent"
            onClick={() => setIsAddFacilitatorOpen(true)}
          >
            <Users className="w-4 h-4 mr-2" />
            Add Facilitator
          </Button>
          {/* <Button className="bg-[#16a34a] text-white hover:bg-[#15803d]">
            <Users className="w-4 h-4 mr-2" />
            Create Manager
          </Button> */}
        </div>
      </div>

      {/* Filters Card */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="col-span-1 md:col-span-2">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Search Users
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label className="text-sm font-medium w-full text-foreground mb-2 block">
              Role
            </label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="learner">Learner</SelectItem>
                <SelectItem value="facilitator">Facilitator</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Button */}
          <div className="col-span-1 flex flex-col justify-end">
            <Button variant="outline" disabled size="sm" className="w-full h-9">
              <Download className="w-4 h-4 mr-2" />
              <span
                className="min-[765px]:max-[1000px]:hidden
"
              >
                Export Data
              </span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <UserTable
          searchQuery={searchQuery}
          roleFilter={roleFilter}
          statusFilter="all"
        />
      </Card>

      <AddLearnerDialog
        open={isAddLearnerOpen}
        onOpenChange={setIsAddLearnerOpen}
      />
      <AddFacilitatorDialog
        open={isAddFacilitatorOpen}
        onOpenChange={setIsAddFacilitatorOpen}
      />
    </div>
  );
}
