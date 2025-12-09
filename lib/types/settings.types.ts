export interface GeneralSettings {
  organisationName: string;
  adminEmail: string;
  timezone: string;
  dateFormat: string;
  language: string;
  profilePicture: string | null;
}

export interface GeneralSettingsResponse {
  success: boolean;
  data: GeneralSettings;
  message?: string;
  updated_fields?: string[];
}

export interface CourseSettings {
  certificateGeneration: boolean;
  cpdCertificateGeneration: boolean;
  quizRetakes: string;
  passingScore: string;
  courseExpiry: string;
}

export interface CourseSettingsResponse {
  success: boolean;
  data: CourseSettings;
  message?: string;
  updated_fields?: string[];
}

export interface LoginSession {
  id: string;
  device: string;
  deviceType: 'desktop' | 'mobile';
  ipAddress: string;
  isCurrent: boolean;
  lastActive: string;
}

export interface LoginSessionsResponse {
  success: boolean;
  data: LoginSession[];
  message?: string;
}


