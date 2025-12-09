"use client"

interface StatusBarProps {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

function StatusBar({ label, value, percentage, color }: StatusBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div className="relative w-full bg-gray-200 rounded-full h-7 overflow-hidden">
        <div 
          className="h-full rounded-full flex items-center justify-end pr-3 transition-all duration-1000 ease-out"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color
          }}
        >
          <span className="text-white text-sm font-semibold">{value}</span>
        </div>
      </div>
    </div>
  );
}

export default function CourseStatusChart() {
  const activeCount = 9;
  const inactiveCount = 4;
  const total = activeCount + inactiveCount;
  
  const activePercentage = Math.round((activeCount / total) * 100);
  const inactivePercentage = Math.round((inactiveCount / total) * 100);

  return (
    <div className="space-y-4 md:space-y-6 w-full">
      <StatusBar 
        label="Active" 
        value={activeCount} 
        percentage={activePercentage}
        color="#8bc34a"
      />
      <StatusBar 
        label="Inactive" 
        value={inactiveCount} 
        percentage={inactivePercentage}
        color="#c4a569"
      />
    </div>
  )
}
