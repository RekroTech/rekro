"use client";

import React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { QueryProvider, ErrorBoundary } from "@/components";
import {
    AuthModalProvider,
    ToastProvider,
    PropertyFormModalProvider,
    ProfileCompletionProvider,
} from "@/contexts";

/**
 * RootProviders - Consolidated Provider Layer
 *
 * Combines all root-level providers into a single composable wrapper:
 * - ErrorBoundary: Catch rendering errors
 * - NuqsAdapter: URL search params synchronization
 * - QueryProvider: React Query (TanStack Query)
 * - ToastProvider: Global toast notifications
 * - AuthModalProvider: Global auth modal state
 * - PropertyFormModalProvider: Global property form modal state
 * - ProfileCompletionProvider: User profile completion state (for all authenticated users)
 *
 * Benefits:
 * - All providers in one place
 * - Easy to add/remove providers
 * - No wrapper files needed
 */
export function RootProviders({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary>
            <NuqsAdapter>
                <QueryProvider>
                    <ToastProvider>
                        <AuthModalProvider>
                            <PropertyFormModalProvider>
                                <ProfileCompletionProvider>
                                    {children}
                                </ProfileCompletionProvider>
                            </PropertyFormModalProvider>
                        </AuthModalProvider>
                    </ToastProvider>
                </QueryProvider>
            </NuqsAdapter>
        </ErrorBoundary>
    );
}

