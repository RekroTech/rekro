"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Cache data for 5 minutes by default
                        staleTime: 5 * 60 * 1000,
                        // Keep unused data in cache for 10 minutes
                        gcTime: 10 * 60 * 1000,
                        // Refetch on window focus only in dev
                        refetchOnWindowFocus: process.env.NODE_ENV === "development",
                        // Refetch on mount if data is stale
                        refetchOnMount: true,
                        // Refetch on reconnect
                        refetchOnReconnect: true,
                        // Retry failed requests once
                        retry: 1,
                        // Retry delay (exponential backoff)
                        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
                        // Use structural sharing for better performance
                        structuralSharing: true,
                        // Network mode: online only
                        networkMode: "online",
                    },
                    mutations: {
                        // Retry failed mutations once
                        retry: 1,
                        // Retry delay for mutations
                        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
                        // Network mode: online only
                        networkMode: "online",
                        // Global error handler
                        onError: (error) => {
                            console.error("Mutation error:", error);
                        },
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === "development" && (
                <ReactQueryDevtools initialIsOpen={false} position="bottom" />
            )}
        </QueryClientProvider>
    );
}
