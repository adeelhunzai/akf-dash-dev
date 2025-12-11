export enum UserRole {
  ADMIN = 'admin',
  LEARNER = 'learner',
  FACILITATOR = 'facilitator',
  MANAGER = 'manager'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  permissions?: Permission[];
}

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  token: string | null;
  isLoggingOut: boolean;
  isInitializing: boolean;
}
