/**
 * Utility Functions Index
 * Named exports for better tree-shaking and Next.js SSR optimization
 *
 * Usage:
 * import { formatDate, validateEmail, canUserEditProperty } from "@/lib/utils";
 */

// ============================================================================
// Date Utilities (Server & Client Safe)
// ============================================================================
export {
    // Date-fns re-exports
    format,
    parseISO,
    addWeeks,
    addMonths,
    addDays,
    subWeeks,
    subMonths,
    subDays,
    formatDistanceToNow,
    isAfter,
    isBefore,
    isSameDay,
    isWithinInterval,
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    // Custom date utilities
    formatDateSafe,
    formatDate,
    formatDateLong,
    formatDateShort,
    formatDateLocale,
    formatDateForInput,
    formatRelativeTime,
    getCurrentTimestamp,
    toISOString,
    getMinStartDate,
    getMaxStartDate,
    isFutureDate,
    isPastDate,
    compareDates,
    isValidDate,
    formatRentalDuration,
} from './dateUtils';

// ============================================================================
// File Utilities (Client-only - uses File API)
// ============================================================================
export {
    isImageFile,
    isVideoFile,
    isMediaFile,
    getFileExtension,
    isImagePath,
    isVideoPath,
    is360Path,
    getMediaType,
    sanitizeFilename,
    formatFileSize,
    validateFileSize,
    validateImageFile,
    validateVideoFile,
} from './fileUtils';

// ============================================================================
// Geospatial Utilities (Server & Client Safe)
// ============================================================================
export {
    calculateDistance,
    isWithinRadius,
    getBoundingBox,
    formatDistance,
} from './geospatial';

// ============================================================================
// Google Maps Utilities (Client-only - requires browser)
// ============================================================================
export {
    loadGoogleMapsScript,
    isGoogleMapsLoaded,
} from './googleMaps';

// ============================================================================
// Inclusions Utilities (Server & Client Safe)
// ============================================================================
export {
    parseInclusions,
} from './inclusions';

// ============================================================================
// Location Privacy Utilities (Server & Client Safe)
// ============================================================================
export {
    getApproximateLocation,
    getLocalityString,
    isWithinRadiusV2,
} from './locationPrivacy';

// ============================================================================
// Email Utilities (Server-only - uses regex validation)
// ============================================================================
export {
    isValidEmail,
    normalizeEmail,
    processEmail,
} from './email';

// ============================================================================
// Authorization Utilities (Server & Client Safe)
// ============================================================================
export {
    ROLE_HIERARCHY,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasRoleLevel,
    isUser,
    isTenant,
    isLandlord,
    isAdmin,
    isSuperAdmin,
    isLandlordOrHigher,
    isAdminOrHigher,
    getHighestRole,
    canManageProperties,
    canManageUsers,
    canApproveApplications,
    requireRole,
    requireAnyRole,
    requireRoleLevel,
} from './authorization';

// ============================================================================
// PDF Generator (Client-only - uses jspdf)
// ============================================================================
export { generateApplicationPDF } from './pdfGenerator';

