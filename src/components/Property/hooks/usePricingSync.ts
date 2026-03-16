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
    // Use -1 as sentinel so the first calculated value always triggers a sync
    const lastSyncedRef = useRef<number>(-1);

    useEffect(() => {
        // Always sync if the calculated rent differs from what the form currently holds
        if (totalWeeklyRent !== currentTotalRent) {
            lastSyncedRef.current = totalWeeklyRent;
            onSync(totalWeeklyRent);
        }
    }, [totalWeeklyRent, currentTotalRent, onSync]);
}
