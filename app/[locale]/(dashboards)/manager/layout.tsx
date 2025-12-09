import type React from "react"
import DashboardLayout from "@/components/shared/layout/dashboard-layout"

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}
