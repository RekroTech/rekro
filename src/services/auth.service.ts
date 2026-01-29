import { SignupCredentials, LoginCredentials, AuthResponse } from "@/types/auth.types";

export const authService = {
    signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
        const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Signup failed");
        }

        return response.json();
    },

    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Login failed");
        }

        return response.json();
    },

    logout: async (): Promise<void> => {
        const response = await fetch("/api/auth/logout", {
            method: "POST",
        });

        if (!response.ok) {
            throw new Error("Logout failed");
        }
    },
};
