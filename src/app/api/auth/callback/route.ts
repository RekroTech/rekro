import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") || "/dashboard";

    // Handle Supabase errors passed in URL (e.g., OAuth/OTP errors)
    const error = requestUrl.searchParams.get("error");
    const errorCode = requestUrl.searchParams.get("error_code");
    const errorDescription = requestUrl.searchParams.get("error_description");

    if (error || errorCode) {
        console.error("Auth callback received error", { error, errorCode, errorDescription });

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
            // Avoid logging sensitive user data; keep details needed for debugging.
            console.error("Auth callback: exchangeCodeForSession failed", {
                message: exchangeError.message,
                status: exchangeError.status,
                name: exchangeError.name,
            });

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

        // If a session wasn't returned, something is off; log once for visibility.
        if (!data?.session) {
            console.error("Auth callback: session exchange succeeded but no session returned");
        }
    }

    // Ensure the redirect is safe (internal only)
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

    // Add a timestamp param to trigger client-side session refresh & cache invalidation.
    const redirectUrl = new URL(safeNext, requestUrl.origin);
    redirectUrl.searchParams.set("session_refresh", Date.now().toString());

    return NextResponse.redirect(redirectUrl.toString());
}
