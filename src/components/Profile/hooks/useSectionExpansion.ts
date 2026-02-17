import { useState, useCallback } from "react";
import { DEFAULT_EXPANDED_SECTIONS } from "@/components/Profile";

/**
 * Custom hook for managing collapsible section state
 * Provides toggle functionality and initial state
 *
 * @param initialState - Optional initial expanded state
 * @returns Current state and toggle handler
 */
export function useSectionExpansion(
    initialState: Record<string, boolean> = DEFAULT_EXPANDED_SECTIONS
) {
    const [expandedSections, setExpandedSections] = useState(initialState);

    const toggleSection = useCallback((sectionId: string) => {
        setExpandedSections((prev) => ({
            ...prev,
            [sectionId]: !prev[sectionId],
        }));
    }, []);

    const expandAll = useCallback(() => {
        setExpandedSections((prev) => {
            const next: Record<string, boolean> = {};
            Object.keys(prev).forEach((key) => {
                next[key] = true;
            });
            return next;
        });
    }, []);

    const collapseAll = useCallback(() => {
        setExpandedSections((prev) => {
            const next: Record<string, boolean> = {};
            Object.keys(prev).forEach((key) => {
                next[key] = false;
            });
            return next;
        });
    }, []);

    return {
        expandedSections,
        toggleSection,
        expandAll,
        collapseAll,
    };
}
