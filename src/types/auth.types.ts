export interface SignupCredentials {
    email: string;
    password: string;
    name?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

// User type represents the authenticated user data
export interface User {
    id: string;
    email: string;
    name?: string | null;
    avatar_url?: string | null;
}

// AuthResponse from the API
export interface AuthResponse {
    user: User;
}

export interface AuthError {
    error: string;
}

// Type for updating user profile
export type UserUpdate = Omit<Partial<User>, "id" | "email"> & {
    name?: string | null;
    avatar_url?: string | null;
};
