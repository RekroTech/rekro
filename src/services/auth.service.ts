import type {
    SignupCredentials,
    LoginCredentials,
    AuthSuccess,
    LogoutSuccess,
    ApiError,
} from "@/types/auth.types";

function isApiError(x: unknown): x is ApiError {
    return (
        typeof x === "object" &&
        x !== null &&
        "error" in x &&
        typeof (x as { error?: unknown }).error === "string"
    );
}

export const authService = {
    signup: async (credentials: SignupCredentials): Promise<AuthSuccess> => {
        const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const body: unknown = await response.json().catch(() => null);
            throw new Error(isApiError(body) ? body.error : "Signup failed");
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
            const body: unknown = await response.json().catch(() => null);
            throw new Error(isApiError(body) ? body.error : "Login failed");
        }

        return (await response.json()) as AuthSuccess;
    },

    logout: async (): Promise<LogoutSuccess> => {
        const response = await fetch("/api/auth/logout", { method: "POST" });

        if (!response.ok) {
            const body: unknown = await response.json().catch(() => null);
            throw new Error(isApiError(body) ? body.error : "Logout failed");
        }

        return (await response.json()) as LogoutSuccess;
    },
};
