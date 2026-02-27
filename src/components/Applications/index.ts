/**
 * Applications Components Index
 * All components are CLIENT-ONLY
 *
 * Usage:
 * import { ApplicationCard, AdminApplicationCard } from "@/components/Applications";
 * import type { ApplicationWithDetails, GroupedApplication } from "@/components/Applications";
 */

// ============================================================================
// Applications Display Components (Client-only)
// ============================================================================
export { ApplicationCard } from "./ApplicationCard";
export type { ApplicationCardProps } from "./ApplicationCard";

export { AdminApplicationCard } from "./AdminApplicationCard";
export type { AdminApplicationCardProps } from "./AdminApplicationCard";

export { ApplicationDetailsModal } from "./ApplicationDetailsModal";

export { DocumentPreviewModal } from "./DocumentPreviewModal";

// ============================================================================
// Applications Types
// ============================================================================
export type { ApplicationWithDetails, GroupedApplication } from "./types";

// ============================================================================
// Applications Utilities
// ============================================================================
export { getStatusColor, getStatusIcon, canWithdraw, downloadApplication } from "./utils";

