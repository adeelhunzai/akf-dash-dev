"use client";

import CourseDetailsContent from "@/components/manager/courses/course-details-content";
import { use } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ManagerCourseDetailsPage({ params }: PageProps) {
  const { id } = use(params);
  return <CourseDetailsContent courseId={parseInt(id)} />;
}
