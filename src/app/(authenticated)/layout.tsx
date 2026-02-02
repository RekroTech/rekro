import React from "react";
import { redirect } from "next/navigation";
import { Header } from "@/components";
import { getSession } from "@/lib/auth/server";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    let user = null;

    try {
        user = await getSession();
    } catch (error) {
        console.error("Auth layout error:", error);
        redirect("/login?error=session");
    }

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-app-bg text-foreground">
            <Header />
            {children}
        </div>
    );
}
