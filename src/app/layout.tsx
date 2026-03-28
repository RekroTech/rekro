import React from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { clsx } from "clsx";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { RootProviders } from "@/components/providers";
import { env } from "@/env";
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
        default: "reKro",
        template: "%s | reKro",
    },
    description:
        "Designed to connect, make friends, and find your next home. Browse properties, connect with people, and discover your perfect rental.",
    keywords: ["rental", "property", "housing", "real estate", "apartments"],
    authors: [{ name: "Rekro" }],
    creator: "Rekro",
    metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
    openGraph: {
        type: "website",
        locale: "en_US",
        siteName: "Rekro",
        title: "reKro",
        description: "Designed to connect, make friends, and find your next home.",
    },
    twitter: {
        card: "summary_large_image",
        title: "reKro",
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
    const isProduction = process.env.NODE_ENV === "production";

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://maps.googleapis.com" />
                <link rel="preconnect" href="https://maps.gstatic.com" crossOrigin="anonymous" />
                <link
                    rel="preconnect"
                    href={env.NEXT_PUBLIC_SUPABASE_URL}
                    crossOrigin="anonymous"
                />
                <title>reKro</title>
            </head>
            <body
                className={clsx(geistSans.variable, geistMono.variable, "antialiased")}
                suppressHydrationWarning
            >
                <RootProviders>
                    <AppShell>{children}</AppShell>
                </RootProviders>
                {isProduction && <Analytics />}
                {isProduction && <SpeedInsights />}
            </body>
        </html>
    );
}
