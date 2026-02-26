/**
 * React Query Hooks Index
 * All hooks here are CLIENT-ONLY and use React Query
 *
 * Usage:
 * import { useSessionUser, useProperties, useCreateProperty } from "@/lib/hooks";
 */

// ============================================================================
// Auth Hooks (Client-only)
// ============================================================================
export {
    useSessionUser,
    useLogout,
    useGoogleLogin,
    useSignInWithOtp,
    useAuthStateSync,
    authKeys,
} from "./auth";

// ============================================================================
// User Hooks (Client-only)
// ============================================================================
export {
    useProfile,
    useUpdateProfile,
    useUserLikes,
    userKeys,
} from "./user";

// ============================================================================
// Role Hooks (Client-only)
// ============================================================================
export {
    useRoles,
} from "./roles";

// ============================================================================
// Property Hooks (Client-only)
// ============================================================================
export {
    useProperties,
    useProperty,
    useCreateProperty,
    useUpdateProperty,
    propertyKeys,
} from "./property";

// ============================================================================
// Unit Hooks (Client-only)
// ============================================================================
export {
    useUnit,
    useUnits,
    useUnitLike,
    useUnitLikesCount,
    useToggleUnitLike,
    useUnitShares,
    useUnitSharesCount,
    useCreateUnitShare,
    unitKeys,
} from "./units";

// ============================================================================
// Application Hooks (Client-only)
// ============================================================================
export {
    useApplications,
    useApplication,
    useUpsertApplication,
    useCreateSnapshot,
    useSubmitApplication,
    useWithdrawApplication,
    applicationKeys,
} from "./application";
