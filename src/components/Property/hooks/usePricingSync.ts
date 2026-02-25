import { useEffect, useRef } from "react";

/**
 * Custom hook to synchronize pricing calculations with form state
 * Prevents infinite loops by using a ref to track the last synced value
 *
 * @param totalWeeklyRent - Calculated total weekly rent from pricing
 * @param currentTotalRent - Current total rent in form state
 * @param onSync - Callback to update the form state
 */
export function usePricingSync(
    totalWeeklyRent: number,
    currentTotalRent: number,
    onSync: (totalRent: number) => void
): void {
    const lastSyncedRef = useRef<number>(currentTotalRent);

    useEffect(() => {
        // Only sync if the calculated value differs from both current and last synced
        if (
            totalWeeklyRent !== currentTotalRent &&
            totalWeeklyRent !== lastSyncedRef.current
        ) {
            lastSyncedRef.current = totalWeeklyRent;
            onSync(totalWeeklyRent);
        }
    }, [totalWeeklyRent, currentTotalRent, onSync]);
}

