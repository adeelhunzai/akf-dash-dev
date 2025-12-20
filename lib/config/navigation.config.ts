import {
  LayoutDashboard,
  User,
  Users2,
  FileChartColumn,
  Book,
  Award,
  BarChart,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  Target,
  GraduationCap,
  BookMarked,
  Users as UsersIcon,
  FolderKanban,
  Trophy,
  FileText,
} from 'lucide-react';
import { UserRole } from '@/lib/types/roles';

export interface NavItem {
  icon: any;
  labelKey: string;
  path: string;
}

export const navigationConfig: Record<UserRole, NavItem[]> = {
  [UserRole.ADMIN]: [
    {
      icon: LayoutDashboard,
      labelKey: 'adminDashboard',
      path: '/admin',
    },
    {
      icon: User,
      labelKey: 'userManagement',
      path: '/admin/user-management',
    },
    {
      icon: Users2,
      labelKey: 'teamManagement',
      path: '/admin/team-management',
    },
    {
      icon: FileChartColumn,
      labelKey: 'reports',
      path: '/admin/reports',
    },
  ],
  [UserRole.LEARNER]: [
    {
      icon: LayoutDashboard,
      labelKey: 'dashboard',
      path: '/learner',
    },
    {
      icon: BookOpen,
      labelKey: 'myCourses',
      path: '/learner/courses',
    },
    {
      icon: Trophy,
      labelKey: 'myBadges',
      path: '/learner/achievements',
    },
    {
      icon: Award,
      labelKey: 'myCertificates',
      path: '/learner/certificates',
    },
  ],
  [UserRole.FACILITATOR]: [
    {
      icon: LayoutDashboard,
      labelKey: 'dashboard',
      path: '/facilitator',
    },
    {
      icon: BookOpen,
      labelKey: 'createCourse',
      path: '/facilitator/create-course',
    },
    {
      icon: UsersIcon,
      labelKey: 'manageLearners',
      path: '/facilitator/manage-learners',
    },
    {
      icon: Award,
      labelKey: 'certificates',
      path: '/facilitator/certificates',
    },
    {
      icon: FileChartColumn,
      labelKey: 'reports',
      path: '/facilitator/reports',
    },
  ],
  [UserRole.MANAGER]: [
    {
      icon: LayoutDashboard,
      labelKey: 'dashboard',
      path: '/manager',
    },
    {
      icon: TrendingUp,
      labelKey: 'analytics',
      path: '/manager/analytics',
    },
    {
      icon: Users2,
      labelKey: 'team',
      path: '/manager/team',
    },
    {
      icon: Target,
      labelKey: 'goals',
      path: '/manager/goals',
    },
  ],
};

export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'Admin Dashboard',
    [UserRole.LEARNER]: 'Learner Dashboard',
    [UserRole.FACILITATOR]: 'Facilitator Dashboard',
    [UserRole.MANAGER]: 'Manager Dashboard',
  };
  return labels[role];
};
