import { withSentryConfig } from "@sentry/nextjs";
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
            {
                protocol: "https",
                hostname: "i.pravatar.cc",
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
                    {
                        key: "Content-Security-Policy",
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.googleapis.com",
                            "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://i.pravatar.cc https://maps.googleapis.com https://maps.gstatic.com",
                            "connect-src 'self' https://*.supabase.co https://o4510117376294912.ingest.us.sentry.io https://vitals.vercel-insights.com https://maps.googleapis.com https://maps.gstatic.com",
                            "font-src 'self' https://fonts.gstatic.com https://maps.gstatic.com",
                            "frame-ancestors 'none'",
                        ].join("; "),
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

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "rekro",

  project: "rekro",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // --- Stack trace linking & release tracking ---
  // Associates every build's source maps with the git commit that produced them.
  // Requires: GitHub integration enabled in Sentry + SENTRY_AUTH_TOKEN in env.
  // https://docs.sentry.io/product/integrations/source-code-mgmt/github/
  release: {
    // Automatically detect commits from the git repo at build time
    setCommits: {
      auto: true,
    },
    // Mark the Vercel environment (production / preview / development) on each release
    deploy: {
      env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "production",
    },
  },

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
