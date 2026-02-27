/**
 * Application Utility Functions
 * Shared utilities for application status handling and styling
 */

import type { IconName } from "@/components/common";
import { ApplicationWithDetails } from "@/components/Applications/types";
import { generateApplicationPDF } from "@/lib/utils";

/**
 * Get Tailwind classes for application status badges
 * @param status - Application status
 * @returns CSS classes for status styling
 */
export function getStatusColor(status: string): string {
    switch (status) {
        case "submitted":
            return "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-700";
        case "under_review":
            return "bg-warning-50 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 border-warning-200 dark:border-warning-700";
        case "approved":
            return "bg-success-bg dark:bg-success-bg text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-700";
        case "rejected":
            return "bg-danger-500/10 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 border-danger-500/20 dark:border-danger-700";
        case "withdrawn":
            return "bg-surface-muted dark:bg-surface-muted text-text-muted dark:text-text-muted border-border dark:border-border";
        default:
            return "bg-surface-muted dark:bg-surface-muted text-text-muted dark:text-text-muted border-border dark:border-border";
    }
}

/**
 * Get icon name for application status
 * @param status - Application status
 * @returns Icon name for the status
 */
export function getStatusIcon(status: string): IconName {
    switch (status) {
        case "submitted":
            return "document";
        case "under_review":
            return "info-circle";
        case "approved":
            return "check-circle";
        case "rejected":
            return "alert-circle";
        case "withdrawn":
            return "x";
        default:
            return "document";
    }
}

/**
 * Check if an application can be withdrawn
 * @param status - Application status
 * @returns True if the application can be withdrawn
 */
export function canWithdraw(status: string): boolean {
    return status === "submitted" || status === "under_review";
}

/**
 * Download application as PDF
 * @param application - Application with full details
 */
export function downloadApplication(application: ApplicationWithDetails): void {
    const property = application.properties;
    const unit = application.units;

    if (!property || !unit) return;

    // Generate PDF using the utility function
    generateApplicationPDF({
        id: application.id,
        status: application.status,
        submitted_at: application.submitted_at,
        created_at: application.created_at,
        updated_at: application.updated_at,
        move_in_date: application.move_in_date,
        rental_duration: application.rental_duration,
        proposed_rent: application.proposed_rent,
        total_rent: application.total_rent,
        message: application.message,
        property: {
            title: property.title,
            location: {
                city: property.location.city,
                state: property.location.state,
            },
        },
        unit: {
            name: unit.name,
            listing_type: unit.listing_type,
            price: unit.price,
        },
    });
}

