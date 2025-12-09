"use client"

import type React from "react"
import { useState } from "react"
import Sidebar from "@/components/shared/navigation/sidebar"
import Header from "@/components/shared/layout/header"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useAuth } from "@/hooks/use-auth"

interface DashboardLayoutProps {
  children?: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")
  
  // Initialize auth (mock user for now)
  useAuth()

  const shouldShowSidebar = isMobile ? sidebarOpen : true

  return (
    <div className="flex h-screen bg-background">
      {shouldShowSidebar && (
        <div className="hidden md:block">
          <Sidebar isOpen={true} isMobile={false} onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full z-50">
            <Sidebar isOpen={true} isMobile={true} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} showMenuButton={isMobile} />
        <main className="flex-1 overflow-y-auto bg-[#fafafa]">{children}</main>
      </div>
    </div>
  )
}
