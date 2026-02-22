import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") || "/dashboard";
    const type = requestUrl.searchParams.get("type"); // email confirmation or OAuth

    // Handle Supabase errors passed in URL (e.g., expired OTP)
    const error = requestUrl.searchParams.get("error");
    const errorCode = requestUrl.searchParams.get("error_code");
    const errorDescription = requestUrl.searchParams.get("error_description");

    if (error || errorCode) {
        console.error("Auth callback received error:", { error, errorCode, errorDescription });

        // Redirect to verify-email page with error parameters for user-friendly display
        const errorParams = new URLSearchParams();
        if (error) errorParams.set("error", error);
        if (errorCode) errorParams.set("error_code", errorCode);
        if (errorDescription) errorParams.set("error_description", errorDescription);

        return NextResponse.redirect(`${requestUrl.origin}/verify-email?${errorParams.toString()}`);
    }

    if (code) {
        const supabase = await createClient();
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
            console.error("Auth callback error:", exchangeError);

            // Handle specific error types
            let errorMessage = "authentication_failed";
            if (exchangeError.message?.includes("expired")) {
                errorMessage = "link_expired";
            } else if (exchangeError.message?.includes("invalid")) {
                errorMessage = "invalid_link";
            }

            return NextResponse.redirect(
                `${requestUrl.origin}/verify-email?error=authentication_failed&error_code=${errorMessage}`
            );
        }

        // After successful email verification, ensure user profile exists
        if (data.user && type === "signup") {
            try {
                // Check if user profile exists
                const { data: existingUser, error: fetchError } = await supabase
                    .from("users")
                    .select("id")
                    .eq("id", data.user.id)
                    .single();

                // If user doesn't exist in users table, create it
                if (fetchError?.code === "PGRST116" || !existingUser) {
                    console.log("Creating user profile for newly verified user:", data.user.id);

                    // Create user profile
                    const { error: insertUserError } = await supabase
                        .from("users")
                        .insert({
                            id: data.user.id,
                            email: data.user.email,
                            full_name: data.user.user_metadata?.name || data.user.email?.split("@")[0],
                        });

                    if (insertUserError) {
                        console.error("Failed to create user profile:", insertUserError);
                    }

                    // Check if user role exists
                    const { data: existingRole } = await supabase
                        .from("user_roles")
                        .select("user_id")
                        .eq("user_id", data.user.id)
                        .single();

                    // Create default role if it doesn't exist
                    if (!existingRole) {
                        const { error: insertRoleError } = await supabase
                            .from("user_roles")
                            .insert({
                                user_id: data.user.id,
                                role: "tenant", // Default role
                            });

                        if (insertRoleError) {
                            console.error("Failed to create user role:", insertRoleError);
                        }
                    }
                }
            } catch (profileError) {
                console.error("Error ensuring user profile exists:", profileError);
                // Don't block the flow, just log the error
            }
        }
    }

    // Ensure the redirect is safe (internal only)
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

    // Always redirect to the intended destination
    return NextResponse.redirect(`${requestUrl.origin}${safeNext}`);
}

