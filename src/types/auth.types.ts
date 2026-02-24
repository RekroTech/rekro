import { AppRole } from "@/types/db";

export interface OtpCredentials {
    email: string;
    redirectTo?: string;
}

/**
 * User identity used for authentication/authorization in the app.
 * Comes from auth.users + public.users + public.user_roles.
 * Note: each user has a single role.
 */
export interface SessionUser {
    id: string;
    email: string;
    name?: string | null;
    image_url?: string | null;
    phone?: string | null;
    role: AppRole;
}

/**
 * Success payload returned by /api/auth/login and /api/auth/signup
 */
export interface AuthSuccess {
    user: SessionUser | null;
    requiresEmailConfirmation?: boolean;
    message?: string;
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
