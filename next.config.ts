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
        ],
        formats: ["image/avif", "image/webp"],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },

    /* Performance Optimizations */
    compress: true,
    poweredByHeader: false,

    /* Experimental Features */
    experimental: {
        optimizePackageImports: ["@tanstack/react-query", "@supabase/supabase-js"],
        // Uncomment if using Turbopack
        // turbo: {},
    },

    /* Type Checking */
    typescript: {
        // Only in production: fail build on type errors
        ignoreBuildErrors: false,
    },
};

export default nextConfig;
