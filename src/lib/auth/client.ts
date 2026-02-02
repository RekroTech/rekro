import { createClient } from "@/lib/supabase/client";

export async function login(email: string, password: string) {
    const supabase = createClient();

    // Validate inputs
    if (!email || !password) {
        return {
            data: null,
            error: new Error("Email and password are required"),
        };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        console.error("Login error:", error.message);
    }

    return { data, error };
}

export async function signup(email: string, password: string, name?: string) {
    const supabase = createClient();

    // Validate inputs
    if (!email || !password) {
        return {
            data: null,
            error: new Error("Email and password are required"),
        };
    }

    if (password.length < 6) {
        return {
            data: null,
            error: new Error("Password must be at least 6 characters"),
        };
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name ?? email.split("@")[0] } },
    });

    if (error) {
        console.error("Signup error:", error.message);
    }

    return { data, error };
}

export async function logout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error("Logout error:", error.message);
    }

    return { error };
}

// Add session refresh helper
export async function refreshSession() {
    const supabase = createClient();
    const { data, error } = await supabase.auth.refreshSession();
    return { data, error };
}

// Add current user getter for client
export async function getCurrentUser() {
    const supabase = createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();
    return { user, error };
}
