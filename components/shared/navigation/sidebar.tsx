"use client"

import Image from "next/image"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Settings, LogOut, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks"
import { navigationConfig } from "@/lib/config/navigation.config"
import { UserRole } from "@/lib/types/roles"
import { useLocale, useTranslations } from "next-intl"
import { handleLogout } from "@/lib/utils/logout"

interface SidebarProps {
  isOpen: boolean
  isMobile: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, isMobile, onClose }: SidebarProps) {
  const dispatch = useAppDispatch()
  const pathname = usePathname()
  const locale = useLocale()
  const tNav = useTranslations("navigation")
  const tCommon = useTranslations("common")
  const token = useAppSelector((state) => state.auth.token)
  const wordpressUrl = useAppSelector((state) => state.auth.wordpressUrl)

  // Get current user role from Redux store (default to ADMIN for now)
  const reduxRole = useAppSelector((state) => state.auth.user?.role) || UserRole.ADMIN

  // Derive role from URL path (more reliable for navigation updates)
  const getRoleFromPath = (): UserRole => {
    if (pathname.includes('/admin')) return UserRole.ADMIN
    if (pathname.includes('/manager')) return UserRole.MANAGER
    if (pathname.includes('/facilitator')) return UserRole.FACILITATOR
    if (pathname.includes('/learner')) return UserRole.LEARNER
    return reduxRole
  }

  const currentRole = getRoleFromPath()

  // Get navigation items based on current role
  const navItems = navigationConfig[currentRole] || navigationConfig[UserRole.ADMIN]

  const handleLogoutClick = async () => {
    await handleLogout(dispatch, token, true, wordpressUrl);
  };

  return (
    <aside className={`w-64 bg-card flex flex-col h-screen ${isMobile ? "shadow-lg" : ""}`}>
      {isMobile && (
        <div className="flex justify-end p-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Logo */}
      <div className={`${isMobile ? "px-6 min-h-[72px]" : "px-6 min-h-[72px] flex justify-center items-end "}`}>
        <a 
          href={wordpressUrl || '#'} 
          className="cursor-pointer"
        >
          <Image 
            src="/AKF-logo.svg" 
            alt="AKF Logo" 
            width={200} 
            height={100} 
            priority 
            style={{ width: 'auto', height: 'auto' }}
          />
        </a>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 px-3 space-y-2  py-6`}>
        {navItems.map((item, index) => {
          const Icon = item.icon
          const localizedPath = `/${locale}${item.path}`
          const isActive = pathname === localizedPath
          return (
            <Link key={item.labelKey} href={localizedPath}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 mb-2 min-h-[50px] cursor-pointer ${
                  isActive
                    ? "bg-[#00b140] text-white rounded-md hover:bg-[#00b140]/75"
                    : ""
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tNav(item.labelKey)}</span>
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-6 space-y-2">
        <Link href={`/${locale}/${currentRole}/settings`}>
          <Button
            variant={pathname.includes("/settings") ? "default" : "ghost"}
            className={`w-full justify-start gap-3 cursor-pointer ${
              pathname.includes("/settings")
                ? "bg-[#00b140] text-white rounded-md hover:bg-[#00b140] hover:text-black"
                : ""
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>{tCommon("settings")}</span>
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 cursor-pointer"
          onClick={handleLogoutClick}
        >
          <LogOut className="w-5 h-5" />
          <span>{tCommon("logout")}</span>
        </Button>
      </div>
    </aside>
  )
}
