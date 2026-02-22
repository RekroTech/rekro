import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") || "/dashboard";
    const type = requestUrl.searchParams.get("type"); // email confirmation or OAuth

    if (code) {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error("Auth callback error:", error);
            const errorType = type === "signup" ? "email_verification_failed" : "oauth_failed";
            return NextResponse.redirect(
                `${requestUrl.origin}/login?error=${errorType}`
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

    // If this was an email verification, add a success flag
    if (type === "signup") {
        return NextResponse.redirect(`${requestUrl.origin}${safeNext}?verified=true`);
    }

    return NextResponse.redirect(`${requestUrl.origin}${safeNext}`);
}

