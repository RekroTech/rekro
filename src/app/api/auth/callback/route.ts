import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") || "/";

    // Handle Supabase errors passed in URL (e.g., OAuth/OTP errors)
    const error = requestUrl.searchParams.get("error");
    const errorCode = requestUrl.searchParams.get("error_code");
    const errorDescription = requestUrl.searchParams.get("error_description");

    // Supabase can also pass errors in the URL fragment (#...). Next.js route handlers
    // don't receive the fragment, so if you see errors on /?error=... the user likely
    // landed on the site root directly (not via this callback).

    if (error || errorCode) {
        console.error("Auth callback received error", { error, errorCode, errorDescription });

        const errorParams = new URLSearchParams();
        if (error) errorParams.set("error", error);
        if (errorCode) errorParams.set("error_code", errorCode);
        if (errorDescription) errorParams.set("error_description", errorDescription);

        // Send auth errors to home page where error modal will display.
        return NextResponse.redirect(`${requestUrl.origin}/?${errorParams.toString()}`);
    }

    if (code) {
        const supabase = await createClient();
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
            console.error("Auth callback: exchangeCodeForSession failed", {
                message: exchangeError.message,
                status: exchangeError.status,
                name: exchangeError.name,
            });

            let mappedCode = "authentication_failed";
            if (exchangeError.message?.toLowerCase().includes("expired")) {
                mappedCode = "link_expired";
            } else if (exchangeError.message?.toLowerCase().includes("invalid")) {
                mappedCode = "invalid_link";
            }

            return NextResponse.redirect(
                `${requestUrl.origin}/?error=authentication_failed&error_code=${mappedCode}`
            );
        }

        if (!data?.session) {
            console.error("Auth callback: session exchange succeeded but no session returned");
        }
    }

    // Ensure the redirect is safe (internal only)
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

    return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
}
