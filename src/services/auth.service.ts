import type {
    SignupCredentials,
    LoginCredentials,
    AuthSuccess,
    LogoutSuccess,
} from "@/types/auth.types";
import { handleFetchError } from "@/lib/utils/api-error";

export const authService = {
    signup: async (credentials: SignupCredentials): Promise<AuthSuccess> => {
        const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            await handleFetchError(response, "Signup failed");
        }

        return (await response.json()) as AuthSuccess;
    },

    login: async (credentials: LoginCredentials): Promise<AuthSuccess> => {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            await handleFetchError(response, "Login failed");
        }

        return (await response.json()) as AuthSuccess;
    },

    logout: async (): Promise<LogoutSuccess> => {
        const response = await fetch("/api/auth/logout", { method: "POST" });

        if (!response.ok) {
            await handleFetchError(response, "Logout failed");
        }

        return (await response.json()) as LogoutSuccess;
    },
};
