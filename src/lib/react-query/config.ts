/**
 * Standardized React Query cache strategies
 */

export const CACHE_STRATEGIES = {
    /**
     * For static content that rarely changes (e.g., property listings, user profiles)
     */
    STATIC: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    },

    /**
     * For dynamic content that updates frequently (e.g., applications, messages)
     */
    DYNAMIC: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
    },

    /**
     * For real-time data that should always be fresh (e.g., notifications)
     */
    REALTIME: {
        staleTime: 0, // Always stale
        gcTime: 0, // Don't cache
    },

    /**
     * For user-specific data that should be fresh but can be cached briefly
     */
    USER_SPECIFIC: {
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
    },
} as const;

