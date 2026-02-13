// Credentials
export interface SignupCredentials {
    email: string;
    password: string;
    name?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

// User roles matching database enum
export type AppRole = "tenant" | "landlord" | "admin" | "super_admin";

export type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";
export type PreferredContactMethod = "email" | "phone" | "sms";

export type UserLocation = Record<string, unknown>;
export type NotificationPreferences = Record<string, unknown>;

// User model used throughout the app (clean, internal)
export interface User {
    id: string;
    email: string;

    // Back-compat: some parts of the app still reference `name`.
    // In DB we store `full_name`.
    name?: string | null;

    full_name?: string | null;
    username?: string | null;
    image_url?: string | null;
    phone?: string | null;

    roles?: AppRole[];

    current_location?: UserLocation | null;
    destination_location?: UserLocation | null;

    study_field?: string | null;
    study_level?: string | null;
    university?: string | null;
    languages?: string[] | null;

    max_budget_per_week?: number | null;
    receive_marketing_email?: boolean;

    date_of_birth?: string | null;
    gender?: Gender | null;
    occupation?: string | null;
    bio?: string | null;

    preferred_contact_method?: PreferredContactMethod;
    notification_preferences?: NotificationPreferences | null;

    last_login_at?: string | null;
    created_at?: string;
    updated_at?: string;
}

/**
 * Success payload returned by /api/auth/login and /api/auth/signup
 */
export interface AuthSuccess {
    user: User;
}

/**
 * Success payload returned by /api/auth/logout
 */
export interface LogoutSuccess {
    success: true;
}

/**
 * Standard error payload returned by your API routes
 * (matches: NextResponse.json({ error: "..." }))
 */
export interface ApiError {
    error: string;
}

/**
 * Optional: richer internal error model (not what the API returns)
 * Use this only if you want codes, localization, etc.
 */
export interface AuthError {
    message: string;
    code?: string;
}

/**
 * Type for updating a user profile
 * (mirrors writable columns on `public.users`)
 */
export type UserUpdate = Omit<Partial<User>, "id" | "email" | "roles">;
