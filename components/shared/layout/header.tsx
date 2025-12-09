"use client";

import {
  Search,
  ChevronDown,
  Menu,
  Shield,
  User,
  Settings,
  LogOut,
  GraduationCap,
  Users,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { setRole } from "@/lib/store/slices/authSlice";
import { UserRole } from "@/lib/types/roles";
import { getRoleLabel } from "@/lib/config/navigation.config";
import { usePathname, useRouter } from "next/navigation";
import LanguageSelector from "@/components/shared/language-selector";
import { useTranslations, useLocale } from 'next-intl';
import { handleLogout } from "@/lib/utils/logout";

interface HeaderProps {
  onMenuClick: () => void;
  showMenuButton?: boolean;
}

export default function Header({
  onMenuClick,
  showMenuButton = false,
}: HeaderProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const currentRole = user?.role || UserRole.ADMIN;
  const tHeader = useTranslations('header');
  const tRoles = useTranslations('roles');
  const tAuth = useTranslations('auth');
  const locale = useLocale();

  // Derive active role from current path to keep navigation and settings in sync
  const getRoleFromPath = (): UserRole => {
    if (pathname.includes('/admin')) return UserRole.ADMIN;
    if (pathname.includes('/learner')) return UserRole.LEARNER;
    if (pathname.includes('/facilitator')) return UserRole.FACILITATOR;
    if (pathname.includes('/manager')) return UserRole.MANAGER;
    return currentRole;
  };

  const activeRole = getRoleFromPath();

  const handleRoleSwitch = (newRole: UserRole) => {
    dispatch(setRole(newRole));
    router.push(`/${locale}/${newRole}`);
  };

  const handleLogoutClick = async () => {
    await handleLogout(dispatch, token, true);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return Shield;
      case UserRole.LEARNER:
        return GraduationCap;
      case UserRole.FACILITATOR:
        return User;
      case UserRole.MANAGER:
        return TrendingUp;
      default:
        return Shield;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "text-[#16a34a]";
      case UserRole.LEARNER:
        return "text-[#3b82f6]";
      case UserRole.FACILITATOR:
        return "text-[#f59e0b]";
      case UserRole.MANAGER:
        return "text-[#8b5cf6]";
      default:
        return "text-[#16a34a]";
    }
  };

  return (
    <header className=" bg-card sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 md:px-6 py-4 gap-4">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="md:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-auto md:mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={tHeader('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          {/* Language Selector */}
          <LanguageSelector />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 md:gap-3 pl-2 md:pl-1 h-9 hover:bg-transparent"
              >
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name || 'User avatar'}
                    className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-[#16a34a] rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {user?.name?.charAt(0).toUpperCase() || "A"}
                  </div>
                )}
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-sm font-medium text-foreground">
                    {user?.name || "Admin User"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user?.email || "admin@akd.org"}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-0">
              <div className="px-4 py-3 border-b border-border">
                <p className="font-semibold text-base">{tHeader('myAccount')}</p>
              </div>
              <div className="p-2">
                {/* Role Switching Options */}
                <DropdownMenuItem 
                  className={`flex items-center gap-3 cursor-pointer py-2 px-3 rounded-md font-medium hover:bg-emerald-50 ${
                    activeRole === UserRole.ADMIN ? getRoleColor(UserRole.ADMIN) : "text-foreground"
                  }`}
                  onClick={() => handleRoleSwitch(UserRole.ADMIN)}
                >
                  <Shield className="w-4 h-4" />
                  <span>{tRoles('admin')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={`flex items-center gap-3 cursor-pointer py-2 px-3 rounded-md font-medium hover:bg-blue-50 ${
                    activeRole === UserRole.LEARNER ? getRoleColor(UserRole.LEARNER) : "text-foreground"
                  }`}
                  onClick={() => handleRoleSwitch(UserRole.LEARNER)}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{tRoles('learner')}</span>
                </DropdownMenuItem>
                {/**
                 * Temporarily hidden: Facilitator and Manager role switches
                 * Uncomment when these dashboards are ready for user switching.
                 */}
                {false && (
                  <>
                    <DropdownMenuItem 
                      className={`flex items-center gap-3 cursor-pointer py-2 px-3 rounded-md font-medium hover:bg-amber-50 ${
                        activeRole === UserRole.FACILITATOR ? getRoleColor(UserRole.FACILITATOR) : "text-foreground"
                      }`}
                      onClick={() => handleRoleSwitch(UserRole.FACILITATOR)}
                    >
                      <User className="w-4 h-4" />
                      <span>{tRoles('facilitator')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className={`flex items-center gap-3 cursor-pointer py-2 px-3 rounded-md font-medium hover:bg-purple-50 ${
                        activeRole === UserRole.MANAGER ? getRoleColor(UserRole.MANAGER) : "text-foreground"
                      }`}
                      onClick={() => handleRoleSwitch(UserRole.MANAGER)}
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>{tRoles('manager')}</span>
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuSeparator className="my-2" />
                
                <DropdownMenuItem 
                  className="flex items-center gap-3 cursor-pointer py-2 px-3 rounded-md text-foreground hover:bg-accent"
                  onClick={() => router.push(`/${locale}/${activeRole}/settings`)}
                >
                  <Settings className="w-4 h-4" />
                  <span>{tHeader('accountSettings')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem 
                  className="flex items-center gap-3 cursor-pointer py-2 px-3 rounded-md text-destructive hover:bg-destructive/10"
                  onClick={handleLogoutClick}
                >
                  <LogOut className="w-4 h-4" />
                  <span>{tAuth('logout')}</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
