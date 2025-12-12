import type { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  change: string
  icon: LucideIcon
  bgColor: string
  iconColor: string
}

export default function MetricCard({ title, value, change, icon: Icon, bgColor, iconColor }: MetricCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-2 md:p-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs md:text-sm text-muted-foreground font-medium mb-2">{title}</p>
          <h3 className="text-xl md:text-2xl font-bold text-foreground">{value}</h3>
        </div>
        <div className={`${bgColor} p-3 m-auto rounded-lg flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  )
}
