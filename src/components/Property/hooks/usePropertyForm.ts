import { useState, useEffect, useRef } from "react";
import { ListingType, Property, Unit } from "@/types/db";
import { PropertyFormData, UnitFormData } from "@/components/Property/types";
import { DEFAULT_UNIT_DATA } from "@/components/Property/constants";
import { getInitialFormData } from "@/components/Property/utils";

export function usePropertyForm(property?: Property, existingUnits: Unit[] = []) {
    const isEditMode = !!property;
    const propertyId = property?.id;
    const prevPropertyIdRef = useRef<string | undefined>(undefined);

    const getInitialUnits = (bedroomCount: number, type: ListingType): UnitFormData[] => {
        const count = type === "room" ? Math.max(1, bedroomCount) : 1;

        return Array.from({ length: count }, (_, index) => ({
            ...DEFAULT_UNIT_DATA,
            name: type === "room" ? `Room ${index + 1}` : "",
            max_occupants: type === "room" ? "1" : "",
        }));
    };

    const mapExistingUnitsToFormData = (units: Unit[]): UnitFormData[] => {
        return units.map((unit) => ({
            name: unit.name || "",
            unit_description: unit.description || "",
            price_per_week: unit.price_per_week?.toString() || "",
            bond_amount: unit.bond_amount?.toString() || "",
            bills_included: unit.bills_included || false,
            min_lease_weeks: unit.min_lease_weeks?.toString() || "",
            max_lease_weeks: unit.max_lease_weeks?.toString() || "",
            max_occupants: unit.max_occupants?.toString() || "",
            size_sqm: unit.size_sqm?.toString() || "",
            available_from: "",
            available_to: "",
            is_available: true,
            availability_notes: "",
        }));
    };

    // Initialize state with lazy initialization to avoid unnecessary computations
    const [formData, setFormData] = useState<PropertyFormData>(() => getInitialFormData(property));
    const [listingType, setListingType] = useState<ListingType>(() => {
        if (property && existingUnits.length > 0) {
            return existingUnits[0]?.listing_type || "entire_home";
        }
        return "entire_home";
    });
    const [activeRoomTab, setActiveRoomTab] = useState(0);
    const [units, setUnits] = useState<UnitFormData[]>(() => {
        if (property && existingUnits.length > 0) {
            return mapExistingUnitsToFormData(existingUnits);
        }
        return getInitialUnits(1, "entire_home");
    });

    // Update state only when property ID actually changes
    useEffect(() => {
        // Check if propertyId has actually changed
        if (prevPropertyIdRef.current === propertyId) {
            return; // No change, skip update
        }

        prevPropertyIdRef.current = propertyId;

        if (property && existingUnits.length > 0) {
            const newFormData = getInitialFormData(property);
            const newListingType = existingUnits[0]?.listing_type || "entire_home";
            const newUnits = mapExistingUnitsToFormData(existingUnits);

            setFormData(newFormData);
            setListingType(newListingType);
            setUnits(newUnits);
            setActiveRoomTab(0);
        } else if (!property) {
            setFormData(getInitialFormData());
            setListingType("entire_home");
            setUnits(getInitialUnits(1, "entire_home"));
            setActiveRoomTab(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [propertyId]);

    // Update units array when listing type or bedrooms change
    useEffect(() => {
        const bedroomCount = parseInt(formData.bedrooms) || 1;
        const requiredCount = listingType === "room" ? Math.max(1, bedroomCount) : 1;

        setUnits((prevUnits) => {
            if (prevUnits.length !== requiredCount) {
                const newUnits = Array.from({ length: requiredCount }, (_, index) => {
                    // Preserve existing data if available
                    if (prevUnits[index]) {
                        return prevUnits[index];
                    }
                    // Create new unit with defaults
                    return {
                        ...DEFAULT_UNIT_DATA,
                        name: listingType === "room" ? `Room ${index + 1}` : "",
                        max_occupants: listingType === "room" ? "1" : "",
                    };
                });
                setActiveRoomTab(0);
                return newUnits;
            }
            return prevUnits;
        });
    }, [listingType, formData.bedrooms]);

    const updateFormData = (updates: Partial<PropertyFormData>) => {
        setFormData((prev) => ({ ...prev, ...updates }));
    };

    const updateUnit = (index: number, updates: Partial<UnitFormData>) => {
        setUnits((prev) => {
            const newUnits = [...prev];
            newUnits[index] = { ...newUnits[index], ...updates } as UnitFormData;
            return newUnits;
        });
    };

    const resetForm = () => {
        setFormData(getInitialFormData());
        setListingType("entire_home");
        setUnits(getInitialUnits(1, "entire_home"));
        setActiveRoomTab(0);
    };

    return {
        isEditMode,
        formData,
        setFormData: updateFormData,
        listingType,
        setListingType,
        activeRoomTab,
        setActiveRoomTab,
        units,
        setUnits,
        updateUnit,
        resetForm,
    };
}
