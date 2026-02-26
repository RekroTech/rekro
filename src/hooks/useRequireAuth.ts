import { useAuthModal } from "@/contexts";
import { useRoles } from "@/lib/hooks/roles";

/**
 * Hook for gating actions behind authentication
 * If user is not logged in, opens auth modal instead of executing action
 *
 * @example
 * const { requireAuth } = useRequireAuth();
 *
 * const handleLike = requireAuth(() => {
 *   // This only runs if user is authenticated
 *   likeProperty(propertyId);
 * }, "/property/123"); // Optional redirect after auth
 */
export function useRequireAuth() {
    const { user } = useRoles();
    const { openAuthModal } = useAuthModal();

    /**
     * Wraps an action to require authentication
     * @param action - The action to execute if authenticated
     * @param redirectTo - Optional path to redirect to after successful auth
     * @returns A function that either executes the action or opens the auth modal
     */
    const requireAuth = <T extends (...args: never[]) => unknown>(
        action: T,
        redirectTo?: string
    ): ((...args: Parameters<T>) => void) => {
        return (...args: Parameters<T>) => {
            if (user) {
                // User is authenticated, execute the action
                action(...args);
            } else {
                // User is not authenticated, open auth modal
                openAuthModal(redirectTo);
            }
        };
    };

    /**
     * Check if user is authenticated
     */
    const isAuthenticated = !!user;

    return {
        requireAuth,
        isAuthenticated,
        openAuthModal,
    };
}

