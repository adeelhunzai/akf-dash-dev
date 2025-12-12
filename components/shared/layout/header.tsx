"use client";

import {
  ChevronDown,
  Menu,
  Shield,
  ShieldUser,
  User,
  Settings,
  LogOut,
  GraduationCap,
  Users,
  TrendingUp,
  FileText,
  FileUser,
  UserCog,
  UserPen,
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
import { useRef, useEffect } from "react";

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
  const tHeader = useTranslations('header');
  const tRoles = useTranslations('roles');
  const tAuth = useTranslations('auth');
  const locale = useLocale();
  
  // Store the user's actual role (permissions) - this should never change
  // It represents what roles the user has access to, not what they're currently viewing
  const actualUserRoleRef = useRef<UserRole | null>(null);
  const userIdRef = useRef<string | null>(null);
  
  // Update the ref when user changes (new user login) or when first set
  useEffect(() => {
    if (user?.id && user?.role) {
      // If it's a different user, reset the ref
      if (userIdRef.current !== user.id) {
        actualUserRoleRef.current = user.role;
        userIdRef.current = user.id;
      } else if (actualUserRoleRef.current === null) {
        // First time setting for this user
        actualUserRoleRef.current = user.role;
        userIdRef.current = user.id;
      }
    } else if (!user) {
      // User logged out, reset refs
      actualUserRoleRef.current = null;
      userIdRef.current = null;
    }
  }, [user?.id, user?.role, user]);
  
  // Get the actual user role (what they have permission for)
  const actualUserRole = actualUserRoleRef.current || user?.role || UserRole.ADMIN;

  // Derive active role from current path to keep navigation and settings in sync
  const getRoleFromPath = (): UserRole => {
    if (pathname.includes('/admin')) return UserRole.ADMIN;
    if (pathname.includes('/learner')) return UserRole.LEARNER;
    if (pathname.includes('/facilitator')) return UserRole.FACILITATOR;
    if (pathname.includes('/manager')) return UserRole.MANAGER;
    return actualUserRole;
  };

  const activeRole = getRoleFromPath();

  const handleRoleSwitch = (newRole: UserRole) => {
    // Don't update the user's actual role - just navigate
    // The actual role represents permissions, activeRole is just the current view
    router.replace(`/${locale}/${newRole}`);
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
              <div className="px-4 py-3">
                <p className="font-semibold text-base">{tHeader('myAccount')}</p>
              </div>
              <div className="p-2">
                {/* Admin Dashboard */}
                {actualUserRole === UserRole.ADMIN && (
                  <DropdownMenuItem 
                    className={`flex items-center gap-3 cursor-pointer py-2 px-3 rounded-md font-medium ${
                      activeRole === UserRole.ADMIN 
                        ? "text-green-600 hover:bg-green-50" 
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => handleRoleSwitch(UserRole.ADMIN)}
                  >
                    <ShieldUser className={`w-4 h-4 ${activeRole === UserRole.ADMIN ? "text-green-600" : "text-gray-600"}`} />
                    <span>Admin Dashboard</span>
                  </DropdownMenuItem>
                )}
                
                {/* Learner Profile */}
                <DropdownMenuItem 
                  className={`flex items-center gap-3 cursor-pointer py-2 px-3 rounded-md font-medium ${
                    activeRole === UserRole.LEARNER 
                      ? "text-green-600 hover:bg-green-50" 
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => handleRoleSwitch(UserRole.LEARNER)}
                >
                  <FileUser className={`w-4 h-4 ${activeRole === UserRole.LEARNER ? "text-green-600" : "text-gray-600"}`} />
                  <span>Learner Profile</span>
                </DropdownMenuItem>
                
                {/* Account Settings */}
                <DropdownMenuItem 
                  className="flex items-center gap-3 cursor-pointer py-2 px-3 rounded-md font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => router.push(`/${locale}/${activeRole}/settings`)}
                >
                  <UserPen className="w-4 h-4 text-gray-600" />
                  <span>Account Settings</span>
                </DropdownMenuItem>
                
                {/* Logout */}
                <DropdownMenuItem 
                  className="flex items-center gap-3 cursor-pointer py-2 px-3 rounded-md font-medium text-gray-700 hover:bg-gray-50"
                  onClick={handleLogoutClick}
                >
                  <LogOut className="w-4 h-4 text-gray-600" />
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
