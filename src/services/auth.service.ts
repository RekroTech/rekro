import type {
    AuthSuccess,
    LogoutSuccess,
    SessionUser, OtpCredentials,
} from "@/types/auth.types";
import { handleFetchError } from "@/lib/utils/api-error";
import { createClient } from "@/lib/supabase/client";

export const authService = {
    loginWithGoogle: async (redirectTo?: string): Promise<void> => {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback?next=${redirectTo || "/"}`,
            },
        });

        if (error) {
            throw new Error(error.message);
        }
    },

    signInWithOtp: async (credentials: OtpCredentials): Promise<AuthSuccess> => {
        const response = await fetch("/api/auth/otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            await handleFetchError(response, "Failed to send magic link");
        }

        return (await response.json()) as AuthSuccess;
    },

    resendOtp: async (credentials: OtpCredentials): Promise<AuthSuccess> => {
        // Same as signInWithOtp - Supabase allows resending by calling signInWithOtp again
        return authService.signInWithOtp(credentials);
    },

    logout: async (): Promise<LogoutSuccess> => {
        const response = await fetch("/api/auth/logout", { method: "POST" });

        if (!response.ok) {
            await handleFetchError(response, "Logout failed");
        }

        return (await response.json()) as LogoutSuccess;
    },

    getSessionUser: async (): Promise<SessionUser | null> => {
        const response = await fetch("/api/auth/me", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            await handleFetchError(response, "Failed to fetch session");
        }

        const json = (await response.json()) as { user: SessionUser | null };
        return json.user ?? null;
    },
};
