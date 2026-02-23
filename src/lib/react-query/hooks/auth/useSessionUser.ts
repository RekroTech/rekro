import { useQuery } from "@tanstack/react-query";
import type { SessionUser } from "@/types/auth.types";
import { authKeys } from "@/lib/react-query/hooks/auth/useAuth";
import { authService } from "@/services/auth.service";

/**
 * Fetches the current SessionUser (auth identity + role + profile data) from the server.
 * Use this for role checks / auth-driven UI.
 *
 * This hook uses React Query's caching to avoid unnecessary refetches.
 * The session user data is considered fresh for 5 minutes.
 */
export function useSessionUser(options?: { enabled?: boolean }) {
    return useQuery<SessionUser | null, Error>({
        queryKey: authKeys.sessionUser(),
        queryFn: async () => {
            try {
                return await authService.getSessionUser();
            } catch (error) {
                // Treat unauthenticated as a null user
                if (error instanceof Error && error.message.includes("Unauthorized")) {
                    return null;
                }
                throw error;
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh for this long
        gcTime: 1000 * 60 * 10, // 10 minutes - keep in cache
        refetchOnWindowFocus: false, // Don't refetch on window focus
        refetchOnMount: true, // Refetch on component mount to ensure fresh data after auth
        retry: false, // Don't retry on auth failures
        enabled: options?.enabled ?? true,
    });
}

