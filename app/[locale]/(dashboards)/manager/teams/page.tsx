import TeamsList from "@/components/manager/teams/teams-list";

export default function ManagerTeamsPage() {
  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50/30">
        <TeamsList />
    </div>
  );
}
