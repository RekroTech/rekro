import React from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { clsx } from "clsx";
import { QueryProvider } from "@/lib/react-query/QueryProvider";
import AppShell from "./AppShell";

import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
    display: "swap",
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    display: "swap",
});

export const metadata: Metadata = {
    title: {
        default: "Rekro - Find Your Next Home",
        template: "%s | Rekro",
    },
    description:
        "Designed to connect, make friends, and find your next home. Browse properties, connect with landlords, and discover your perfect rental.",
    keywords: ["rental", "property", "housing", "real estate", "apartments"],
    authors: [{ name: "Rekro" }],
    creator: "Rekro",
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    openGraph: {
        type: "website",
        locale: "en_US",
        siteName: "Rekro",
        title: "Rekro - Find Your Next Home",
        description: "Designed to connect, make friends, and find your next home.",
    },
    twitter: {
        card: "summary_large_image",
        title: "Rekro - Find Your Next Home",
        description: "Designed to connect, make friends, and find your next home.",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
        { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={clsx(geistSans.variable, geistMono.variable, "antialiased")}
                suppressHydrationWarning
            >
                <QueryProvider>
                    <AppShell>{children}</AppShell>
                </QueryProvider>
            </body>
        </html>
    );
}
