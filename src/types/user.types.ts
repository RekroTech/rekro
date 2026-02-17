/**
 * User and Profile types
 * All user-related types and profile system types
 */
import { Profile, ProfileUpdate, UserApplicationProfile, UserApplicationProfileUpdate } from "./db";


export type UserLocation = Record<string, unknown>;
export type NotificationPreferences = Record<string, unknown>;

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
  phone: string | null;
  nativeLanguage: string | null;

  // Personal details
  dateOfBirth: string | null;
  age: number | null;
  gender: string | null;
  occupation: string | null;
  bio: string | null;

  // Current & Target
  currentLocation: string | null;
  preferredLocality: string | null;
  budget: number | null;

  // Application profile
  visaStatus: string | null;
  employmentStatus: string | null;
  studentStatus: string | null;
  hasPets: boolean | null;
  smoker: boolean | null;

  // Profile completion
  completionPercentage: number;
}
