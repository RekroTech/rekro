import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* React Compiler (experimental) */
    reactCompiler: true,

    /* Image Optimization */
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**.supabase.co",
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
            },
        ],
        formats: ["image/avif", "image/webp"],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    },

    /* Performance Optimizations */
    compress: true,
    poweredByHeader: false,

    /* Experimental Features */
    experimental: {
        optimizePackageImports: ["@tanstack/react-query", "@supabase/supabase-js"],
        // Enable Server Actions caching
        serverActions: {
            bodySizeLimit: "2mb",
        },
        // Optimize CSS
        optimizeCss: true,
        // Enable PPR (Partial Prerendering) when ready
        // ppr: "incremental",
    },

    /* Turbopack Configuration (Next.js 16+) */
    // Turbopack is used by default for both dev and production builds
    // It handles code splitting, chunking, and optimizations automatically
    // The optimizePackageImports above handles React Query and Supabase bundling
    turbopack: {},

    /* Logging */
    logging: {
        fetches: {
            fullUrl: true,
        },
    },

    /* Type Checking */
    typescript: {
        ignoreBuildErrors: false,
    },

    /* Headers for security and caching */
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    {
                        key: "X-DNS-Prefetch-Control",
                        value: "on",
                    },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=63072000; includeSubDomains; preload",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "SAMEORIGIN",
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "X-XSS-Protection",
                        value: "1; mode=block",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "origin-when-cross-origin",
                    },
                ],
            },
            {
                source: "/api/:path*",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "no-store, must-revalidate",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
