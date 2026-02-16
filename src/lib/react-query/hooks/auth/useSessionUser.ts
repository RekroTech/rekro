import { useQuery } from "@tanstack/react-query";
import type { SessionUser } from "@/types/auth.types";
import { authKeys } from "@/lib/react-query/hooks/auth/useAuth";
import { authService } from "@/services/auth.service";

/**
 * Fetches the current SessionUser (auth identity + role) from the server.
 * Use this for role checks / auth-driven UI.
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
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
        retry: false,
        enabled: options?.enabled ?? true,
    });
}

