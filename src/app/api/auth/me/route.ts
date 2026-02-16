import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/auth/me
 * Returns the current session user (auth identity + role).
 */
export async function GET() {
    const user = await getSession();
    return NextResponse.json({ user }, { status: 200 });
}

