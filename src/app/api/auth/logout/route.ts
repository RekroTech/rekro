import { NextResponse } from "next/server";
import { logout } from "@/lib/auth";

export async function POST() {
    try {
        const { error } = await logout();

        if (error) {
            return NextResponse.json({ error }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err) {
        console.error("Logout error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
