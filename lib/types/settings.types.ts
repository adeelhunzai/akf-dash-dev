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

// Facilitator Settings Types
export interface FacilitatorSettings {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  country: string;
  organisation: string;
  profilePicture: string | null;
  passwordLastChanged: string;
}

export interface FacilitatorSettingsAvailableOption {
  value: string;
  label: string;
}

export interface FacilitatorSettingsAvailableOptions {
  genders: FacilitatorSettingsAvailableOption[];
  countries: FacilitatorSettingsAvailableOption[];
}

export interface FacilitatorSettingsResponse {
  success: boolean;
  data: FacilitatorSettings;
  available_options: FacilitatorSettingsAvailableOptions;
  message?: string;
}

export interface FacilitatorSettingsUpdateRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: string;
  country?: string;
  organisation?: string;
  profilePicture?: string | null;
}

export interface FacilitatorSettingsUpdateResponse {
  success: boolean;
  message?: string;
  updated_fields?: string[];
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message?: string;
}
