/**
 * Date Utilities
 * Re-export date-fns functions with safe null/undefined handling
 */

// Re-export all date-fns functions for direct use
export {
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
} from "date-fns";

import { format, parseISO, addWeeks, formatDistanceToNow, isAfter, isBefore } from "date-fns";

// ============================================================================
// SAFE DATE FORMATTING HELPERS (with null handling)
// ============================================================================

/**
 * Safely format date with null/undefined handling
 * @example formatDateSafe("2026-02-12", "MMM d, yyyy") => "Feb 12, 2026"
 */
export const formatDateSafe = (
    dateString: string | null | undefined,
    formatStr: string
): string => {
    if (!dateString) return "";
    try {
        return format(parseISO(dateString), formatStr);
    } catch {
        return "";
    }
};

/**
 * Common date format shortcuts
 */
export const formatDate = (date: string | null | undefined) =>
    formatDateSafe(date, "MMM d, yyyy");

export const formatDateLong = (date: string | null | undefined) =>
    formatDateSafe(date, "MMMM d, yyyy");

export const formatDateShort = (date: string | null | undefined) =>
    formatDateSafe(date, "MMM d, yyyy");

export const formatDateLocale = (date: string | null | undefined) =>
    formatDateSafe(date, "P");

export const formatDateForInput = (date: string | null | undefined) =>
    formatDateSafe(date, "yyyy-MM-dd");

export const formatRelativeTime = (date: string | null | undefined) => {
    if (!date) return "";
    try {
        return formatDistanceToNow(parseISO(date), { addSuffix: true });
    } catch {
        return "";
    }
};

// ============================================================================
// TIMESTAMP UTILITIES
// ============================================================================

/** Get current timestamp as ISO string */
export const getCurrentTimestamp = () => new Date().toISOString();

/** Convert to ISO string safely */
export const toISOString = (date: Date | string | null | undefined): string => {
    if (!date) return "";
    try {
        return typeof date === 'string' ? parseISO(date).toISOString() : date.toISOString();
    } catch {
        return "";
    }
};

// ============================================================================
// DATE RANGE UTILITIES
// ============================================================================

/** Get min start date (today or available_from, whichever is later) */
export const getMinStartDate = (availableFrom: string | null | undefined): string => {
    const now = new Date();
    if (!availableFrom) return formatDateForInput(now.toISOString());

    const availableDate = parseISO(availableFrom);
    return formatDateForInput(isAfter(availableDate, now) ? availableFrom : now.toISOString());
};

/** Get max start date (2 weeks from min, capped at available_to) */
export const getMaxStartDate = (
    availableFrom: string | null | undefined,
    availableTo: string | null | undefined
): string => {
    const minDate = parseISO(getMinStartDate(availableFrom));
    const twoWeeksLater = addWeeks(minDate, 2);

    if (availableTo) {
        const maxDate = parseISO(availableTo);
        return formatDateForInput(
            isBefore(maxDate, twoWeeksLater) ? availableTo : twoWeeksLater.toISOString()
        );
    }

    return formatDateForInput(twoWeeksLater.toISOString());
};

// ============================================================================
// DATE COMPARISON (with safe null handling)
// ============================================================================

export const isFutureDate = (date: string | null | undefined): boolean => {
    if (!date) return false;
    try {
        return isAfter(parseISO(date), new Date());
    } catch {
        return false;
    }
};

export const isPastDate = (date: string | null | undefined): boolean => {
    if (!date) return false;
    try {
        return isBefore(parseISO(date), new Date());
    } catch {
        return false;
    }
};

export const compareDates = (date1: string | null | undefined, date2: string | null | undefined): number => {
    if (!date1 || !date2) return 0;
    try {
        const d1 = parseISO(date1).getTime();
        const d2 = parseISO(date2).getTime();
        return d1 < d2 ? -1 : d1 > d2 ? 1 : 0;
    } catch {
        return 0;
    }
};

// ============================================================================
// VALIDATION
// ============================================================================

export const isValidDate = (dateString: string | null | undefined): boolean => {
    if (!dateString) return false;
    try {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    } catch {
        return false;
    }
};

// ============================================================================
// BUSINESS LOGIC HELPERS
// ============================================================================

/** Format rental duration (e.g., "3 months") */
export const formatRentalDuration = (months: number | null | undefined): string | undefined => {
    if (months === null || months === undefined) return undefined;
    return `${months} ${months === 1 ? 'month' : 'months'}`;
};

