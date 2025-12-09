"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, X, Search, Loader2 } from "lucide-react"
import { useGetUsersListQuery } from "@/lib/store/api/userApi"
import { useGetCoursesListQuery } from "@/lib/store/api/coursesApi"
import { useCreateTeamMutation, useUpdateTeamMutation, useGetTeamDetailsQuery } from "@/lib/store/api/teamApi"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import type { Team } from "@/lib/types/team.types"

interface Learner {
  id: number
  initials: string
  name: string
  email: string
  selected?: boolean
}

interface CreateTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team?: Team // Optional team for edit mode
}

// Helper function to get initials from name
const getInitials = (name: string) => {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export default function CreateTeamDialog({ open, onOpenChange, team }: CreateTeamDialogProps) {
  const isEditMode = !!team
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    teamName: "",
    description: "",
  })
  const [selectedLearners, setSelectedLearners] = useState<Set<number>>(new Set())
  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(new Set())
  const [selectedFacilitators, setSelectedFacilitators] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [allLearners, setAllLearners] = useState<Learner[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isSearching, setIsSearching] = useState(false)

  // Course-specific state
  const [courseSearchQuery, setCourseSearchQuery] = useState("")
  const [debouncedCourseSearch, setDebouncedCourseSearch] = useState("")
  const [currentCoursePage, setCurrentCoursePage] = useState(1)
  const [allCourses, setAllCourses] = useState<Array<{ id: number; title: string }>>([])
  const [hasMoreCourses, setHasMoreCourses] = useState(true)
  const [showCourseDropdown, setShowCourseDropdown] = useState(false)

  // Facilitator-specific state
  const [facilitatorSearchQuery, setFacilitatorSearchQuery] = useState("")
  const [debouncedFacilitatorSearch, setDebouncedFacilitatorSearch] = useState("")
  const [currentFacilitatorPage, setCurrentFacilitatorPage] = useState(1)
  const [allFacilitators, setAllFacilitators] = useState<Learner[]>([])
  const [hasMoreFacilitators, setHasMoreFacilitators] = useState(true)
  const [isSearchingFacilitators, setIsSearchingFacilitators] = useState(false)
  const [showFacilitatorDropdown, setShowFacilitatorDropdown] = useState(false)

  // Fetch team details when in edit mode
  const { data: teamDetails, isLoading: isLoadingTeamDetails } = useGetTeamDetailsQuery(
    team?.id || 0,
    { skip: !open || !isEditMode }
  )

  // Fetch learners (users with learner role) - 10 per page
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isFetching: isFetchingUsers,
  } = useGetUsersListQuery(
    {
      page: currentPage,
      per_page: 10,
      search: debouncedSearch,
      role: 'learner',
    },
    {
      skip: !open,
      refetchOnMountOrArgChange: true,
    },
  )

  // Fetch courses with pagination and search
  const { 
    data: coursesData, 
    isLoading: isLoadingCourses,
    isFetching: isFetchingCourses 
  } = useGetCoursesListQuery({
    page: currentCoursePage,
    per_page: 20,
    search: debouncedCourseSearch
  }, {
    skip: !open,
    refetchOnMountOrArgChange: true,
  })

  // Fetch facilitators (users with facilitator role) - 10 per page
  const {
    data: facilitatorsData,
    isLoading: isLoadingFacilitators,
    isFetching: isFetchingFacilitators,
  } = useGetUsersListQuery(
    {
      page: currentFacilitatorPage,
      per_page: 10,
      search: debouncedFacilitatorSearch,
      role: 'facilitator',
    },
    {
      skip: !open,
      refetchOnMountOrArgChange: true,
    },
  )

  // Create and update team mutations
  const [createTeam, { isLoading: isCreating }] = useCreateTeamMutation()
  const [updateTeam, { isLoading: isUpdating }] = useUpdateTeamMutation()
  const isLoading = isCreating || isUpdating

  // Debounce search query - wait 500ms after user stops typing
  useEffect(() => {
    // Set searching state when user types
    if (searchQuery !== debouncedSearch) {
      setIsSearching(true)
    }

    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1) // Reset to page 1 when search changes
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, debouncedSearch])

  // Debounce course search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCourseSearch(courseSearchQuery)
      setCurrentCoursePage(1) // Reset to page 1 when search changes
    }, 500)
    return () => clearTimeout(timer)
  }, [courseSearchQuery])

  // Debounce facilitator search
  useEffect(() => {
    if (facilitatorSearchQuery !== debouncedFacilitatorSearch) {
      setIsSearchingFacilitators(true)
    }
    const timer = setTimeout(() => {
      setDebouncedFacilitatorSearch(facilitatorSearchQuery)
      setCurrentFacilitatorPage(1) // Reset to page 1 when search changes
    }, 500)
    return () => clearTimeout(timer)
  }, [facilitatorSearchQuery, debouncedFacilitatorSearch])

  // Update learners list when new data arrives
  useEffect(() => {
    if (usersData?.users) {
      const newLearners = usersData.users.map((user) => ({
        id: user.ID,
        name: user.display_name,
        email: user.user_email,
        initials: getInitials(user.display_name),
        selected: selectedLearners.has(user.ID)
      }))

      if (currentPage === 1) {
        // Replace learners on first page or new search
        setAllLearners(newLearners)
      } else {
        // Append learners on subsequent pages, filtering out duplicates
        setAllLearners(prev => {
          const existingIds = new Set(prev.map(l => l.id))
          const uniqueNewLearners = newLearners.filter(l => !existingIds.has(l.id))
          return [...prev, ...uniqueNewLearners]
        })
      }

      // Check if there are more pages
      setHasMore(usersData.current_page < usersData.total_pages)
      
      // Clear searching state when data arrives
      setIsSearching(false)
    }
  }, [usersData, currentPage, selectedLearners])

  // Update courses list when new data arrives
  useEffect(() => {
    if (coursesData) {
      if (currentCoursePage === 1) {
        // Replace list on first page or new search
        setAllCourses(coursesData.courses)
      } else {
        // Append to list on subsequent pages
        setAllCourses(prev => {
          const existingIds = new Set(prev.map(c => c.id))
          const newCourses = coursesData.courses.filter((c: any) => !existingIds.has(c.id))
          return [...prev, ...newCourses]
        })
      }
      
      // Check if there are more courses to load
      setHasMoreCourses(currentCoursePage < coursesData.total_pages)
    }
  }, [coursesData, currentCoursePage])

  // Update facilitators list when new data arrives
  useEffect(() => {
    if (facilitatorsData?.users) {
      const newFacilitators = facilitatorsData.users.map((user) => ({
        id: user.ID,
        name: user.display_name,
        email: user.user_email,
        initials: getInitials(user.display_name),
        selected: selectedFacilitators.has(user.ID)
      }))

      if (currentFacilitatorPage === 1) {
        // Replace facilitators on first page or new search
        setAllFacilitators(newFacilitators)
      } else {
        // Append facilitators on subsequent pages, filtering out duplicates
        setAllFacilitators(prev => {
          const existingIds = new Set(prev.map(f => f.id))
          const uniqueNewFacilitators = newFacilitators.filter(f => !existingIds.has(f.id))
          return [...prev, ...uniqueNewFacilitators]
        })
      }

      // Check if there are more pages
      setHasMoreFacilitators(facilitatorsData.current_page < facilitatorsData.total_pages)
      
      // Clear searching state when data arrives
      setIsSearchingFacilitators(false)
    }
  }, [facilitatorsData, currentFacilitatorPage, selectedFacilitators])

  // Reset form when team changes (switching between different teams)
  useEffect(() => {
    if (isEditMode && open && team?.id) {
      // Reset form immediately when a different team is selected
      setFormData({ teamName: "", description: "" })
      setSelectedLearners(new Set())
      setSelectedCourses(new Set())
      setSelectedFacilitators(new Set())
      // Clear learners list when switching teams
      setAllLearners([])
      setCurrentPage(1)
      setSearchQuery("")
      setDebouncedSearch("")
      // Clear facilitators list
      setAllFacilitators([])
      setCurrentFacilitatorPage(1)
      setFacilitatorSearchQuery("")
      setDebouncedFacilitatorSearch("")
    }
  }, [team?.id, isEditMode, open])

  // Populate form when team details are loaded in edit mode
  useEffect(() => {
    if (isEditMode && teamDetails?.team && open) {
      const teamData = teamDetails.team
      // Only populate if this is the team we're currently editing
      if (teamData.id === team?.id) {
        setFormData({
          teamName: teamData.name,
          description: teamData.description || "",
        })
        setSelectedLearners(new Set(teamData.learner_ids))
        // Set selected courses from course_ids array
        if (teamData.course_ids && Array.isArray(teamData.course_ids) && teamData.course_ids.length > 0) {
          setSelectedCourses(new Set(teamData.course_ids))
        } else {
          setSelectedCourses(new Set())
        }
        // Set selected facilitators from facilitator_ids array
        if (teamData.facilitator_ids && Array.isArray(teamData.facilitator_ids) && teamData.facilitator_ids.length > 0) {
          setSelectedFacilitators(new Set(teamData.facilitator_ids))
        } else {
          setSelectedFacilitators(new Set())
        }
      }
    }
  }, [teamDetails, isEditMode, open, team?.id])

  // Reset when modal opens/closes
  useEffect(() => {
    if (!open) {
      setCurrentPage(1)
      setAllLearners([])
      setSearchQuery("")
      setDebouncedSearch("")
      setHasMore(true)
      setIsSearching(false)
      // Reset course selection
      setSelectedCourses(new Set())
      setCourseSearchQuery("")
      setCurrentCoursePage(1)
      setAllCourses([])
      setShowCourseDropdown(false)
      // Reset facilitator selection
      setSelectedFacilitators(new Set())
      setFacilitatorSearchQuery("")
      setCurrentFacilitatorPage(1)
      setAllFacilitators([])
      setShowFacilitatorDropdown(false)
      // Reset form
      setFormData({ teamName: "", description: "" })
      setSelectedLearners(new Set())
      setSelectedCourses(new Set())
      setSelectedFacilitators(new Set())
    } else if (!isEditMode) {
      // Reset form when opening in create mode
      setFormData({ teamName: "", description: "" })
      setSelectedLearners(new Set())
      setSelectedCourses(new Set())
      setSelectedFacilitators(new Set())
    }
  }, [open, isEditMode])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (showCourseDropdown) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if (!target.closest('[data-course-dropdown]')) {
          setShowCourseDropdown(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCourseDropdown])

  // Close facilitator dropdown when clicking outside
  useEffect(() => {
    if (showFacilitatorDropdown) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if (!target.closest('[data-facilitator-dropdown]')) {
          setShowFacilitatorDropdown(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFacilitatorDropdown])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleLearnerToggle = (id: number) => {
    setSelectedLearners((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Handle course selection
  const handleCourseToggle = (courseId: number) => {
    setSelectedCourses((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(courseId)) {
        newSet.delete(courseId)
      } else {
        newSet.add(courseId)
      }
      return newSet
    })
  }

  // Handle facilitator selection
  const handleFacilitatorToggle = (facilitatorId: number) => {
    setSelectedFacilitators((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(facilitatorId)) {
        newSet.delete(facilitatorId)
      } else {
        newSet.add(facilitatorId)
      }
      return newSet
    })
  }

  // Handle infinite scroll for learners
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight

    // Load more when scrolled to 80% of the container
    if (scrollPercentage > 0.8 && hasMore && !isFetchingUsers) {
      setCurrentPage(prev => prev + 1)
    }
  }

  // Handle infinite scroll for courses
  const handleCourseScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight

    if (scrollPercentage > 0.8 && hasMoreCourses && !isFetchingCourses) {
      setCurrentCoursePage(prev => prev + 1)
    }
  }

  // Handle infinite scroll for facilitators
  const handleFacilitatorScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight

    if (scrollPercentage > 0.8 && hasMoreFacilitators && !isFetchingFacilitators) {
      setCurrentFacilitatorPage(prev => prev + 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.teamName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a team name",
        variant: "destructive"
      })
      return
    }

    if (selectedCourses.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one course",
        variant: "destructive"
      })
      return
    }

    if (selectedLearners.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one learner",
        variant: "destructive"
      })
      return
    }

    try {
      if (isEditMode && team?.id) {
        // Update existing team
        const result = await updateTeam({
          teamId: team.id,
          name: formData.teamName,
          course_ids: Array.from(selectedCourses),
          description: formData.description,
          learner_ids: Array.from(selectedLearners),
          facilitator_ids: Array.from(selectedFacilitators)
        }).unwrap()

        toast({
          title: "Success",
          description: result.message || "Team updated successfully"
        })
      } else {
        // Create new team
      const result = await createTeam({
        name: formData.teamName,
          course_ids: Array.from(selectedCourses),
        description: formData.description,
          learner_ids: Array.from(selectedLearners),
          facilitator_ids: Array.from(selectedFacilitators)
      }).unwrap()

      toast({
        title: "Success",
        description: result.message || "Team created successfully"
      })
      }

      // Reset form
      setFormData({ teamName: "", description: "" })
      setSelectedLearners(new Set())
      setSelectedCourses(new Set())
      setSelectedFacilitators(new Set())
      setSearchQuery("")
      setCourseSearchQuery("")
      setCurrentCoursePage(1)
      setAllCourses([])
      setFacilitatorSearchQuery("")
      setCurrentFacilitatorPage(1)
      setAllFacilitators([])
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || (isEditMode ? "Failed to update team" : "Failed to create team"),
        variant: "destructive"
      })
    }
  }

  const selectedCount = selectedLearners.size

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[950px] w-[95vw] p-0 gap-0 overflow-hidden" showCloseButton={false}>
        <DialogTitle className="sr-only">Create New Team</DialogTitle>
        <div className="flex">
          {/* Left Column - Form */}
          <div className="w-[420px] flex-shrink-0 p-8 flex flex-col">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">
              {isEditMode ? "Update Team" : "Create New Team"}
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
              {(isLoadingTeamDetails && isEditMode) || (isEditMode && open && (!teamDetails?.team || teamDetails?.team.id !== team?.id)) ? (
                <div className="space-y-6 flex-1">
                  {/* Team Name Skeleton */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                  {/* Course Skeleton */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                  {/* Facilitator Skeleton */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                  {/* Description Skeleton */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                </div>
              ) : (
              <div className="space-y-6 flex-1">
                {/* Team Name */}
                <div className="space-y-2">
                  <Label htmlFor="teamName" className="text-sm font-medium text-gray-700">
                    Team Name
                  </Label>
                  <Input
                    id="teamName"
                    name="teamName"
                    placeholder="2021_EST_CircleK_1"
                    value={formData.teamName}
                    onChange={handleInputChange}
                    className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      disabled={isLoadingTeamDetails}
                  />
                </div>

                  {/* Courses */}
                  <div className="space-y-2 relative" data-course-dropdown>
                  <Label htmlFor="course" className="text-sm font-medium text-gray-700">
                      Courses
                  </Label>
                    
                    <div className="relative">
                      {/* Selected Courses Display / Search Input */}
                      <div
                        className="w-full h-11 px-3 border border-gray-300 rounded-md bg-white text-gray-900 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 cursor-pointer flex items-center justify-between"
                        onClick={() => !isLoadingTeamDetails && setShowCourseDropdown(!showCourseDropdown)}
                      >
                        {selectedCourses.size > 0 ? (
                          <span className="text-gray-900 truncate">
                            {selectedCourses.size} course{selectedCourses.size !== 1 ? 's' : ''} selected
                          </span>
                        ) : (
                          <span className="text-gray-400">Select course(s)</span>
                        )}
                        <svg
                          className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${showCourseDropdown ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>

                    {/* Dropdown Panel */}
                    {showCourseDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                        {/* Search Input */}
                        <div className="p-2 border-b border-gray-200">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search courses..."
                              value={courseSearchQuery}
                              onChange={(e) => setCourseSearchQuery(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                        </div>

                        {/* Courses List */}
                        <div 
                          className="max-h-60 overflow-y-auto"
                          onScroll={handleCourseScroll}
                        >
                          {isLoadingCourses && currentCoursePage === 1 ? (
                            <div className="p-4 space-y-2">
                              {Array.from({ length: 5 }).map((_, index) => (
                                <Skeleton key={index} className="h-10 w-full" />
                              ))}
                            </div>
                          ) : allCourses.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              <p className="text-sm">No courses found</p>
                            </div>
                          ) : (
                            <>
                              {allCourses.map((course) => (
                                <label
                                  key={course.id}
                                  htmlFor={`course-${course.id}`}
                                  className={`px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                                    selectedCourses.has(course.id) ? 'bg-green-50' : 'text-gray-900'
                                  }`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Checkbox
                                    id={`course-${course.id}`}
                                    checked={selectedCourses.has(course.id)}
                                    onCheckedChange={() => handleCourseToggle(course.id)}
                                    className="w-5 h-5 border-gray-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <p className={`text-sm font-medium flex-1 ${selectedCourses.has(course.id) ? 'text-green-700' : ''}`}>
                        {course.title}
                                  </p>
                                </label>
                              ))}
                              
                              {/* Loading More Indicator */}
                              {isFetchingCourses && currentCoursePage > 1 && (
                                <div className="p-3 text-center border-t border-gray-100">
                                  <Loader2 className="w-4 h-4 animate-spin mx-auto text-gray-400" />
                                </div>
                              )}

                              {/* Load More Info */}
                              {hasMoreCourses && !isFetchingCourses && (
                                <div className="p-2 text-center text-xs text-gray-400 border-t border-gray-100">
                                  Scroll for more courses
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                  {/* Facilitators */}
                  <div className="space-y-2 relative" data-facilitator-dropdown>
                    <Label htmlFor="facilitators" className="text-sm font-medium text-gray-700">
                      Facilitators
                    </Label>
                    
                    <div className="relative">
                      {/* Selected Facilitators Display / Search Input */}
                      <div
                        className="w-full h-11 px-3 border border-gray-300 rounded-md bg-white text-gray-900 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 cursor-pointer flex items-center justify-between"
                        onClick={() => !isLoadingTeamDetails && setShowFacilitatorDropdown(!showFacilitatorDropdown)}
                      >
                        {selectedFacilitators.size > 0 ? (
                          <span className="text-gray-900 truncate">
                            {selectedFacilitators.size} facilitator{selectedFacilitators.size !== 1 ? 's' : ''} selected
                          </span>
                        ) : (
                          <span className="text-gray-400">Select facilitator(s)</span>
                        )}
                        <svg
                          className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${showFacilitatorDropdown ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>

                      {/* Dropdown Panel */}
                      {showFacilitatorDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                          {/* Search Input */}
                          <div className="p-2 border-b border-gray-200">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Search facilitators..."
                                value={facilitatorSearchQuery}
                                onChange={(e) => setFacilitatorSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                              />
                            </div>
                          </div>

                          {/* Facilitators List */}
                          <div 
                            className="max-h-60 overflow-y-auto"
                            onScroll={handleFacilitatorScroll}
                          >
                            {(isSearchingFacilitators || (isLoadingFacilitators && currentFacilitatorPage === 1)) && allFacilitators.length === 0 ? (
                              <div className="p-4 space-y-2">
                                {Array.from({ length: 5 }).map((_, index) => (
                                  <div key={index} className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1">
                                      <Skeleton className="h-4 w-32 mb-2" />
                                      <Skeleton className="h-3 w-48" />
                                    </div>
                                    <Skeleton className="h-5 w-5" />
                                  </div>
                                ))}
                              </div>
                            ) : allFacilitators.length === 0 ? (
                              <div className="p-4 text-center text-gray-500">
                                <p className="text-sm">No facilitators found</p>
                              </div>
                            ) : (
                              <>
                                {allFacilitators.map((facilitator) => (
                                  <label
                                    key={facilitator.id}
                                    htmlFor={`facilitator-${facilitator.id}`}
                                    className={`px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                                      selectedFacilitators.has(facilitator.id) ? 'bg-green-50' : 'text-gray-900'
                                    }`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Checkbox
                                      id={`facilitator-${facilitator.id}`}
                                      checked={selectedFacilitators.has(facilitator.id)}
                                      onCheckedChange={() => handleFacilitatorToggle(facilitator.id)}
                                      className="w-5 h-5 border-gray-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex items-center gap-3 flex-1">
                                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 bg-green-500">
                                        {facilitator.initials}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${selectedFacilitators.has(facilitator.id) ? 'text-green-700' : 'text-gray-900'}`}>
                                          {facilitator.name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">{facilitator.email}</p>
                                      </div>
                                    </div>
                                  </label>
                                ))}
                                
                                {/* Loading More Indicator */}
                                {isFetchingFacilitators && currentFacilitatorPage > 1 && (
                                  <div className="p-3 text-center border-t border-gray-100">
                                    <Loader2 className="w-4 h-4 animate-spin mx-auto text-gray-400" />
                                  </div>
                                )}

                                {/* Load More Info */}
                                {hasMoreFacilitators && !isFetchingFacilitators && (
                                  <div className="p-2 text-center text-xs text-gray-400 border-t border-gray-100">
                                    Scroll for more facilitators
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Enter team description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-3 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none"
                      disabled={isLoadingTeamDetails}
                  />
                </div>
              </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-8">
                <Button
                  type="button"
                  variant="outline"
                  className="px-6 h-10 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || isLoadingTeamDetails}
                  className="px-6 h-10 bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isEditMode ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    isEditMode ? "Update Team" : "Create Team"
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column - Learners */}
          <div className="flex-1 border-l border-gray-200 p-8 flex flex-col relative">
            {/* Close button */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Learners</h2>

            {/* Search Input */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search learner by name or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                disabled={isLoadingTeamDetails}
              />
            </div>

            {/* Learners List with Infinite Scroll */}
            <div 
              className="space-y-3 overflow-y-auto pr-2 h-[350px] border border-gray-200 rounded-lg p-3" 
              onScroll={handleScroll}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#d1d5db #f3f4f6'
              }}
            >
              {/* Show skeleton loaders when: initial load, searching, or loading team details in edit mode */}
              {((isSearching || (isLoadingUsers && currentPage === 1)) && allLearners.length === 0) || 
               (isEditMode && (isLoadingTeamDetails || !teamDetails?.team || teamDetails?.team.id !== team?.id)) ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-5 w-5" />
                    </div>
                  ))}
                </div>
              ) : allLearners.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {debouncedSearch ? "No learners found matching your search" : "No learners available"}
                </div>
              ) : (
                <>
                  {/* Learners List */}
                  {allLearners.map((learner) => (
                    <div key={learner.id} className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 bg-green-500"
                      >
                        {learner.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{learner.name}</p>
                        <p className="text-sm text-gray-500">{learner.email}</p>
                      </div>
                      <Checkbox
                        checked={selectedLearners.has(learner.id)}
                        onCheckedChange={() => handleLearnerToggle(learner.id)}
                        className="w-5 h-5 border-gray-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                    </div>
                  ))}
                  
                  {/* Loading indicator for infinite scroll - shows at bottom */}
                  {isFetchingUsers && currentPage > 1 && (
                    <div className="flex items-center justify-center py-4 border-t border-gray-100 mt-2">
                      <Loader2 className="w-5 h-5 animate-spin text-green-500" />
                      <span className="ml-2 text-sm text-gray-600">Loading more...</span>
                    </div>
                  )}
                  
                  {/* End of list indicator */}
                  {!hasMore && allLearners.length > 0 && !isFetchingUsers && (
                    <div className="text-center py-3 text-sm text-gray-400 border-t border-gray-100 mt-2">
                      No more learners
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Selection Info and Import */}
            <div className="flex items-center justify-between pt-6 mt-4">
              <span className="text-sm text-gray-600">Selected: {selectedCount}</span>
              <Button
                type="button"
                variant="outline"
                className="gap-2 h-10 px-4 text-green-600 border-green-500 hover:bg-green-50 bg-white"
              >
                <Upload className="w-4 h-4" />
                Import CSV
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
