import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(req: NextRequest) {
    // Only refresh session cookies for protected areas
    const { supabaseResponse } = await updateSession(req);
    return supabaseResponse;
}

export const config = {
    matcher: ["/dashboard/:path*", "/settings/:path*", "/account/:path*", "/accommodations/:path*"],
};
