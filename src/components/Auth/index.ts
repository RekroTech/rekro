/**
 * Auth Components Index
 * All components are CLIENT-ONLY
 *
 * Usage:
 * import { AuthModal, EmailSentSuccess, useEmailVerification } from "@/components/Auth";
 */

// ============================================================================
// Auth Components (Client-only)
// ============================================================================
export { VerificationErrorModal } from "./VerificationErrorModal";
export { AuthModal } from "./AuthModal";
export { EmailSentSuccess } from "./EmailSentSuccess";

// ============================================================================
// Auth Hooks (Client-only)
// ============================================================================
export { useEmailVerification } from "./hooks";

// ============================================================================
// Auth Types
// ============================================================================
export type { EmailVerificationError } from "./types";
