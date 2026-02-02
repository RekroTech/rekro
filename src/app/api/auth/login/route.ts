import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";

type LoginBody = {
    email?: unknown;
    password?: unknown;
};

function isNonEmptyString(v: unknown): v is string {
    return typeof v === "string" && v.trim().length > 0;
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as LoginBody;

        const email = isNonEmptyString(body.email) ? body.email.trim() : "";
        const password = isNonEmptyString(body.password) ? body.password : "";

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        const { user, error } = await login(email, password);

        if (error || !user) {
            return NextResponse.json({ error: error || "Invalid credentials" }, { status: 401 });
        }

        return NextResponse.json({ user }, { status: 200 });
    } catch (err) {
        console.error("Login error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
