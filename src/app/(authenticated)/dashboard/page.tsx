"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to home page as it now serves the same purpose
        router.replace("/");
    }, [router]);

    return null;
}
