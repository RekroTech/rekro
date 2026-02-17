"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import type { Unit, OccupancyType, Application } from "@/types/db";
import type { RentalFormData } from "@/components/Property/types";
import { getMinStartDate } from "@/components/Property/utils";

type UnitOccupancies = Record<string, number>;

interface RentalFormProviderProps {
    children: React.ReactNode;
    selectedUnit: Unit | null;
    unitOccupancies?: UnitOccupancies;
    existingApplication?: Application | null;
}

interface RentalFormContextValue {
    rentalForm: RentalFormData;
    setRentalForm: React.Dispatch<React.SetStateAction<RentalFormData>>;
    updateRentalForm: (updates: Partial<RentalFormData>) => void;
}

const RentalFormContext = createContext<RentalFormContextValue | null>(null);

function getDefaultInclusions(isEntireHome: boolean): RentalFormData["inclusions"] {
    return {
        furniture: { selected: !isEntireHome, price: 0 },
        bills: { selected: !isEntireHome, price: 0 },
        cleaning: { selected: false, price: 0 },
        carpark: { selected: false, price: 0 },
        storage: { selected: false, price: 0 },
    };
}

function normalizeOccupancyType(next: OccupancyType, selectedUnit: Unit | null): OccupancyType {
    if (!selectedUnit) return next;

    const canDual = selectedUnit.listing_type !== "entire_home" && selectedUnit.max_occupants === 2;
    if (!canDual) return "single";

    return next === "dual" ? "dual" : "single";
}

function applicationToRentalForm(
    app: Application,
    selectedUnit: Unit
): Partial<RentalFormData> {
    const isEntireHome = selectedUnit.listing_type === "entire_home";

    return {
        moveInDate: app.move_in_date ?? getMinStartDate(selectedUnit.available_from),
        rentalDuration: app.rental_duration ?? 12,
        occupancyType: normalizeOccupancyType(app.occupancy_type ?? "single", selectedUnit),
        inclusions: {
            ...getDefaultInclusions(isEntireHome),
            ...(app.inclusions ?? {}),
        },
        message: app.message ?? "",
        proposedRent: app.proposed_rent !== null && app.proposed_rent !== undefined ? String(app.proposed_rent) : "",
    };
}

export function RentalFormProvider({
    children,
    selectedUnit,
    unitOccupancies,
    existingApplication,
}: RentalFormProviderProps) {
    const [rentalForm, setRentalForm] = useState<RentalFormData>(() => ({
        moveInDate: getMinStartDate(selectedUnit?.available_from),
        rentalDuration: 12,
        occupancyType: normalizeOccupancyType("single", selectedUnit),
        inclusions: getDefaultInclusions(selectedUnit?.listing_type === "entire_home"),
        message: "",
        proposedRent: "",
    }));

    // Track whether the user has modified the form since last hydration.
    const isDirtyRef = useRef(false);

    const updateRentalForm = useCallback((updates: Partial<RentalFormData>) => {
        isDirtyRef.current = true;
        setRentalForm((prev) => ({ ...prev, ...updates }));
    }, []);

    // Track unit changes to reset only unit-dependent fields.
    const lastUnitIdRef = useRef<string | null>(null);
    const lastListingTypeRef = useRef<Unit["listing_type"] | null>(null);

    useEffect(() => {
        const nextUnitId = selectedUnit?.id ?? null;
        const nextListingType = selectedUnit?.listing_type ?? null;

        const hasUnitChanged = nextUnitId !== lastUnitIdRef.current;
        const hasListingTypeChanged = nextListingType !== lastListingTypeRef.current;

        if (!hasUnitChanged && !hasListingTypeChanged) return;

        lastUnitIdRef.current = nextUnitId;
        lastListingTypeRef.current = nextListingType;

        // If no unit, keep current state (sidebar shows placeholder anyway)
        if (!selectedUnit) return;

        // Defer updates to avoid cascading renders (mirrors current code style)
        const timeoutId = setTimeout(() => {
            setRentalForm((prev) => {
                const nextIsEntireHome = selectedUnit.listing_type === "entire_home";

                return {
                    ...prev,
                    moveInDate: getMinStartDate(selectedUnit.available_from),
                    occupancyType: normalizeOccupancyType(prev.occupancyType, selectedUnit),
                    inclusions: hasListingTypeChanged
                        ? getDefaultInclusions(nextIsEntireHome)
                        : prev.inclusions,
                };
            });
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [selectedUnit]);

    // Hydrate from an existing application (e.g. after page reload) if provided.
    const lastHydratedApplicationIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!selectedUnit) return;
        if (!existingApplication) return;

        // Safety: only hydrate if the application is for this unit (or no unit on app).
        if (existingApplication.unit_id && existingApplication.unit_id !== selectedUnit.id) return;

        // Only hydrate once per application id.
        if (lastHydratedApplicationIdRef.current === existingApplication.id) return;

        // Don't clobber user edits.
        if (isDirtyRef.current) return;

        lastHydratedApplicationIdRef.current = existingApplication.id;

        const timeoutId = setTimeout(() => {
            setRentalForm((prev) => ({
                ...prev,
                ...applicationToRentalForm(existingApplication, selectedUnit),
            }));
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [existingApplication, selectedUnit]);

    // Sync occupancyType with externally managed occupancies if provided.
    useEffect(() => {
        if (!selectedUnit || !unitOccupancies) return;

        const occ = unitOccupancies[selectedUnit.id];
        if (occ !== 1 && occ !== 2) return;

        const desired: OccupancyType = occ === 2 ? "dual" : "single";

        const timeoutId = setTimeout(() => {
            setRentalForm((prev) => {
                const normalized = normalizeOccupancyType(desired, selectedUnit);
                if (prev.occupancyType === normalized) return prev;
                return { ...prev, occupancyType: normalized };
            });
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [selectedUnit, unitOccupancies]);

    const value = useMemo<RentalFormContextValue>(
        () => ({ rentalForm, setRentalForm, updateRentalForm }),
        [rentalForm, updateRentalForm]
    );

    return <RentalFormContext.Provider value={value}>{children}</RentalFormContext.Provider>;
}

export function useRentalForm() {
    const ctx = useContext(RentalFormContext);
    if (!ctx) {
        throw new Error("useRentalForm must be used within a RentalFormProvider");
    }
    return ctx;
}
