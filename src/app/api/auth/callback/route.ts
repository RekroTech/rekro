import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") || "/dashboard";

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
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

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

        // Session exchange successful
        // User profile and role are automatically created by Supabase database triggers
        console.log("Auth session established successfully");
    }

    // Ensure the redirect is safe (internal only)
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

    // Add a timestamp parameter to force client-side session refresh
    const redirectUrl = new URL(safeNext, requestUrl.origin);
    redirectUrl.searchParams.set('session_refresh', Date.now().toString());

    // Create the redirect response
    // The session cookies are automatically set by the Supabase client during exchangeCodeForSession
    return NextResponse.redirect(redirectUrl.toString());
}

