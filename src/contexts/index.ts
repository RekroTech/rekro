/**
 * React Context Index
 * All contexts are CLIENT-ONLY (use "use client" directive)
 *
 * Usage:
 * import { AuthModalProvider, useAuthModal, ToastProvider, useToast } from "@/contexts";
 */

// ============================================================================
// Toast Context (Client-only)
// ============================================================================
export { ToastProvider, useToast } from "./ToastContext";
export type { ToastMessage } from "./ToastContext";

// ============================================================================
// Profile Completion Context (Client-only)
// ============================================================================
export { ProfileCompletionProvider, useProfileCompletion } from "./ProfileCompletionContext";

// ============================================================================
// Auth Modal Context (Client-only)
// ============================================================================
export { AuthModalProvider, useAuthModal } from "./AuthModalContext";

// ============================================================================
// Document Operations Context (Client-only)
// ============================================================================
export { DocumentOperationsProvider, useDocumentOperations } from "./DocumentOperationsContext";
