"use client"

import { useState, useEffect } from "react"
import { Search, Download, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import TeamTable from "./team-table"
import CreateTeamDialog from "./create-team-dialog"

export default function TeamManagementContent() {
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false)

  // Debounce search - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [searchInput])

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground mt-1">Manage learning teams and their progress</p>
        </div>

        {/* Create Team Button */}
        <Button className="bg-[#16a34a] text-white hover:bg-[#15803d] w-fit" onClick={() => setIsCreateTeamOpen(true)}>
          <Users className="w-4 h-4 mr-2" />
          Create Team
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="col-span-1">
            <label className="text-sm font-medium text-foreground mb-2 block">Search Teams</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by team, course, or facilitator..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        {/* Export Button */}
        <div className="col-span-1 flex flex-col justify-end">
          <Button variant="outline" className="w-full h-9" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Teams
          </Button>
        </div>
        </div>

      </Card>

      {/* Teams Table */}
      <Card>
        <TeamTable searchQuery={debouncedSearch} statusFilter={statusFilter} />
      </Card>

      <CreateTeamDialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen} />
    </div>
  )
}
