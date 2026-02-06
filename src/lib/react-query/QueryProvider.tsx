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
                        // Cache data for 5 minutes
                        staleTime: 5 * 60 * 1000,
                        // Keep unused data in cache for 10 minutes
                        gcTime: 10 * 60 * 1000,
                        // Don't refetch on window focus in production
                        refetchOnWindowFocus: process.env.NODE_ENV === "development",
                        // Retry failed requests once
                        retry: 1,
                        // Use structural sharing for better performance
                        structuralSharing: true,
                    },
                    mutations: {
                        // Retry failed mutations once
                        retry: 1,
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
