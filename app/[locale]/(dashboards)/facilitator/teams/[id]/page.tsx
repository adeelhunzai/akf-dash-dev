import LearnerDetailsContent from "@/components/facilitator/teams/learner-details-content";

export default function LearnerDetailsPage({ params }: { params: { id: string } }) {
  return <LearnerDetailsContent learnerId={params.id} />;
}
