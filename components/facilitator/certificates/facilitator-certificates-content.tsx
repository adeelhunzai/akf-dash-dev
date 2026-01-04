"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Download, Award, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useGetFacilitatorCertificatesQuery, useGetFacilitatorTeamsQuery, useGetFacilitatorCoursesQuery } from "@/lib/store/api/userApi";
import { Skeleton } from "@/components/ui/skeleton";
import { FacilitatorCertificate } from "@/lib/types/wordpress-user.types";

export default function FacilitatorCertificatesContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [allCertificates, setAllCertificates] = useState<FacilitatorCertificate[]>([]);
  const perPage = 10;
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: certsData, isLoading: certsLoading, isFetching: certsFetching } = useGetFacilitatorCertificatesQuery({
    page,
    per_page: perPage,
    search: searchQuery || undefined,
    team_id: selectedTeam !== "all" ? parseInt(selectedTeam) : undefined,
    course_id: selectedCourse !== "all" ? parseInt(selectedCourse) : undefined
  });

  const { data: teamsData } = useGetFacilitatorTeamsQuery();
  const { data: coursesData } = useGetFacilitatorCoursesQuery({ status: 'all' });

  const pagination = certsData?.data?.pagination;
  const stats = certsData?.data?.stats;
  const teams = teamsData?.data?.teams || [];
  const courses = coursesData?.data?.courses || [];

  // Reset when filters change
  useEffect(() => {
    setPage(1);
    setAllCertificates([]);
  }, [searchQuery, selectedTeam, selectedCourse]);

  // Append new data when page changes
  useEffect(() => {
    if (certsData?.data?.certificates) {
      if (page === 1) {
        setAllCertificates(certsData.data.certificates);
      } else {
        setAllCertificates(prev => [...prev, ...certsData.data.certificates]);
      }
    }
  }, [certsData, page]);

  // Infinite scroll with IntersectionObserver
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && !certsFetching && pagination && page < pagination.total_pages) {
      setPage(prev => prev + 1);
    }
  }, [certsFetching, pagination, page]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  const hasMore = pagination ? page < pagination.total_pages : false;

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white rounded-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Certificates Issued</p>
                {certsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-3xl font-bold">{stats?.total_issued || 0}</div>
                )}
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#00B140] flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table Container */}
      <div className="border border-gray-200 rounded-md bg-white">
        {/* Filters Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search learners or certificates ID"
                className="pl-10 bg-white rounded-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-full md:w-[200px] bg-white rounded-md">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-full md:w-[200px] bg-white rounded-md">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Certificates Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b">
                <TableHead className="text-sm font-normal text-muted-foreground">Learner</TableHead>
                <TableHead className="text-sm font-normal text-muted-foreground">Course</TableHead>
                <TableHead className="text-sm font-normal text-muted-foreground">Final Grade</TableHead>
                <TableHead className="text-sm font-normal text-muted-foreground">Completion Date</TableHead>
                <TableHead className="text-sm font-normal text-muted-foreground">Certificate ID</TableHead>
                <TableHead className="text-sm font-normal text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certsLoading && page === 1 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : allCertificates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No certificates found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                allCertificates.map((cert) => {
                  const gradeValue = parseInt(cert.final_grade);
                  const gradeColor = gradeValue >= 90 ? 'text-[#00B140]' : gradeValue >= 80 ? 'text-[#5B8DEF]' : gradeValue >= 70 ? 'text-[#FFA500]' : 'text-[#FF6B6B]';
                  
                  return (
                    <TableRow key={cert.id} className="border-b hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-foreground">{cert.learner.name}</span>
                          <span className="text-xs text-muted-foreground">{cert.learner.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {cert.course}
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-semibold ${gradeColor}`}>
                          {cert.final_grade}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {cert.completion_date}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {cert.certificate_url ? cert.display_id : (
                          <span className="text-muted-foreground">Not issued</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {cert.certificate_url ? (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-[#00B140] hover:text-[#00B140]/80 hover:bg-[#00B140]/10"
                            onClick={async () => {
                              try {
                                const response = await fetch(cert.certificate_url);
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `${cert.display_id}.pdf`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(url);
                              } catch (error) {
                                // Fallback: open in new tab if fetch fails
                                window.open(cert.certificate_url, '_blank');
                              }
                            }}
                            title="Download Certificate"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                            <Download className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Infinite Scroll Loading Indicator */}
        <div ref={loadMoreRef} className="p-4 flex justify-center">
          {certsFetching && page > 1 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading more...</span>
            </div>
          )}
          {!hasMore && allCertificates.length > 0 && (
            <span className="text-sm text-muted-foreground">All certificates loaded</span>
          )}
        </div>
      </div>
    </div>
  );
}
