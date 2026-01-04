import CourseDetailsContent from "@/components/facilitator/courses/course-details-content"

export default async function CourseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CourseDetailsContent courseId={id} />
}
