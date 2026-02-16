/**
 * User and Profile types
 * All user-related types and profile system types
 */
import { Profile, ProfileUpdate, UserApplicationProfile, UserApplicationProfileUpdate } from "./db";

export type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";
export type PreferredContactMethod = "email" | "phone" | "sms";

export type UserLocation = Record<string, unknown>;
export type NotificationPreferences = Record<string, unknown>;

// Employment and student status types matching database constraints
export type EmploymentStatus = "working" | "not_working";
export type StudentStatus = "student" | "not_student";

// UserProfile matches the API response structure with nested user_application_profile
export type UserProfile = Profile & {
    user_application_profile: UserApplicationProfile | null;
};

export type UpdateProfile = ProfileUpdate & UserApplicationProfileUpdate;

// ============================================================================
// Profile System Types
// ============================================================================

export interface ProfileSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  completionPercentage: number;
  required: boolean;
}

export interface DocumentUpload {
  id: string;
  name: string;
  type: string;
  url?: string;
  uploadedAt?: string;
  required: boolean;
  category: DocumentCategory;
}

export type DocumentCategory =
  | "identification"
  | "education"
  | "employment"
  | "financial"
  | "references";

export interface ProfileDocument {
  // Identification
  passport: DocumentUpload | null;
  visa: DocumentUpload | null;
  drivingLicense: DocumentUpload | null;

  // Education
  studentId: DocumentUpload | null;
  coe: DocumentUpload | null; // Confirmation of Enrollment

  // Employment
  employmentLetter: DocumentUpload | null;
  payslips: DocumentUpload | null;

  // Financial
  bankStatement: DocumentUpload | null;
  proofOfFunds: DocumentUpload | null;

  // References
  referenceLetter: DocumentUpload | null;
  guarantorLetter: DocumentUpload | null;
}

export interface ProfileCompletion {
  totalPercentage: number;
  sections: ProfileSection[];
  unlockedBadges: string[];
  isComplete: boolean;
}

export interface ShareableProfile {
  fullName: string;
  username: string | null;
  email: string;
  imageUrl: string | null;
  nativeLanguage: string | null;

  // Current & Target
  currentLocation: string | null;
  targetLocation: string | null;
  budget: number | null;

  // Profile completion
  completionPercentage: number;
}
