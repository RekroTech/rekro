import { useState, useEffect, useRef } from "react";
import { ListingType, Unit } from "@/types/db";
import { PropertyFormData, UnitFormData } from "@/components/Property/types";
import { DEFAULT_UNIT_DATA } from "@/components/Property/constants";
import { formatDateForInput, getInitialFormData } from "@/components/Property/utils";
import { Property } from "@/types/property.types";

export type ListingTypeSelection = ListingType | "all";

/**
 * Hook for managing property form state including units management
 *
 * Unit Management Logic:
 * - "entire_home": 1 unit with listing_type='entire_home'
 * - "room": N units with listing_type='room' (N = bedroom count, min 1)
 * - "all": 1 entire_home unit + N room units (N = bedroom count, min 1)
 *
 * Unit Tracking:
 * - Existing units have an 'id' field (for UPDATE)
 * - New units have no 'id' field (for CREATE)
 * - Deleted units are tracked in deletedUnitIds state (for DELETE)
 * - All current units are sent to API which handles the operations
 *
 * When listing type or bedroom count changes:
 * - Units are intelligently preserved or created
 * - Excess units are marked for deletion
 * - The API handles all create/update/delete operations
 */
export function usePropertyForm(property?: Property, existingUnits: Unit[] = []) {
    const isEditMode = !!property;
    const propertyId = property?.id;
    const isInitialMount = useRef(true);

    const mapExistingUnitsToFormData = (units: Unit[]): UnitFormData[] => {
        return units.map((unit) => {
            const pricePerWeek = unit.price_per_week?.toString() || "";
            // Always calculate bond as 4x weekly rent
            const calculatedBond = unit.price_per_week ? (unit.price_per_week * 4).toString() : "";

            return {
                id: unit.id,
                listing_type: unit.listing_type,
                name: unit.name || "",
                unit_description: unit.description || "",
                price_per_week: pricePerWeek,
                bond_amount: calculatedBond,
                bills_included: unit.bills_included || false,
                min_lease: unit.min_lease?.toString() || "4",
                max_lease: unit.max_lease?.toString() || "12",
                max_occupants: unit.max_occupants?.toString() || "",
                size_sqm: unit.size_sqm?.toString() || "",
                available_from: formatDateForInput(unit.available_from),
                available_to: formatDateForInput(unit.available_to),
                is_available: unit.is_available ?? true,
                availability_notes: "",
            };
        });
    };

    const inferListingTypeFromExistingUnits = (units: Unit[]): ListingTypeSelection => {
        if (!units || units.length === 0) return "entire_home";

        const hasEntireHome = units.some((u) => u.listing_type === "entire_home");
        const hasRoom = units.some((u) => u.listing_type === "room");

        if (hasEntireHome && hasRoom) return "all";
        return units[0]?.listing_type || "entire_home";
    };

    // Initialize state
    const [formData, setFormData] = useState<PropertyFormData>(() =>
        property
            ? getInitialFormData({ ...property, units: property.units ?? existingUnits ?? [] })
            : getInitialFormData()
    );
    const [listingType, setListingType] = useState<ListingTypeSelection>(() => {
        if (property && existingUnits.length > 0) {
            return inferListingTypeFromExistingUnits(existingUnits);
        }
        return "entire_home";
    });
    const [activeRoomTab, setActiveRoomTab] = useState(0);
    const [units, setUnits] = useState<UnitFormData[]>(() => {
        return property && existingUnits.length > 0
            ? mapExistingUnitsToFormData(existingUnits)
            : [{ ...DEFAULT_UNIT_DATA }];
    });
    const [deletedUnitIds, setDeletedUnitIds] = useState<string[]>([]);

    // Sync units structure when listing type or bedrooms change
    const syncUnits = (type: ListingTypeSelection, bedroomCount: number) => {
        setUnits((prevUnits) => {
            const entireHomes = prevUnits.filter((u) => u.listing_type === "entire_home");
            const rooms = prevUnits.filter((u) => u.listing_type === "room");
            const newUnits: UnitFormData[] = [];
            const toDelete: string[] = [];
            const roomsNeeded = Math.max(1, bedroomCount);

            if (type === "entire_home") {
                // Keep or create 1 entire home, delete all rooms
                if (entireHomes[0]) {
                    newUnits.push(entireHomes[0]);
                } else if (rooms[0]) {
                    // Copy first room's details to entire_home
                    newUnits.push({
                        ...rooms[0],
                        id: undefined, // Remove ID to create new unit
                        listing_type: "entire_home",
                        name: "",
                    });
                } else {
                    newUnits.push({ ...DEFAULT_UNIT_DATA, listing_type: "entire_home" });
                }

                // Mark all extra entire homes and all rooms for deletion
                entireHomes.slice(1).forEach((u) => u.id && toDelete.push(u.id));
                rooms.forEach((u) => u.id && toDelete.push(u.id));
            } else if (type === "room") {
                // Create room units, copy entire_home details to first room if switching
                for (let i = 0; i < roomsNeeded; i++) {
                    const existingRoom = rooms[i];
                    if (existingRoom) {
                        newUnits.push(existingRoom);
                    } else if (i === 0 && entireHomes[0] && rooms.length === 0) {
                        // First room: copy entire_home details when switching from entire_home to room
                        newUnits.push({
                            ...entireHomes[0],
                            id: undefined, // Remove ID to create new unit
                            listing_type: "room",
                            name: "Room 1",
                            max_occupants: "1",
                        });
                    } else {
                        // New room with defaults
                        newUnits.push({
                            ...DEFAULT_UNIT_DATA,
                            listing_type: "room",
                            name: `Room ${i + 1}`,
                            max_occupants: "1",
                        });
                    }
                }

                // Mark all entire homes and extra rooms for deletion
                entireHomes.forEach((u) => u.id && toDelete.push(u.id));
                rooms.slice(roomsNeeded).forEach((u) => u.id && toDelete.push(u.id));
            } else {
                // type === "all": 1 entire home + N rooms

                // Handle entire home
                if (entireHomes[0]) {
                    newUnits.push(entireHomes[0]);
                } else {
                    newUnits.push({
                        ...DEFAULT_UNIT_DATA,
                        listing_type: "entire_home",
                        name: "Entire Home",
                        max_occupants: "",
                    });
                }

                // Handle rooms
                for (let i = 0; i < roomsNeeded; i++) {
                    const existingRoom = rooms[i];
                    if (existingRoom) {
                        newUnits.push(existingRoom);
                    } else {
                        newUnits.push({
                            ...DEFAULT_UNIT_DATA,
                            listing_type: "room",
                            name: `Room ${i + 1}`,
                            max_occupants: "1",
                        });
                    }
                }

                // Mark extra units for deletion
                entireHomes.slice(1).forEach((u) => u.id && toDelete.push(u.id));
                rooms.slice(roomsNeeded).forEach((u) => u.id && toDelete.push(u.id));
            }

            if (toDelete.length > 0) {
                setDeletedUnitIds((prev) => [...new Set([...prev, ...toDelete])]);
            }

            setActiveRoomTab((prev) => Math.min(prev, Math.max(0, newUnits.length - 1)));
            return newUnits;
        });
    };

    // Sync when property changes (edit mode - when switching between different properties)
    useEffect(() => {
        if (property && existingUnits.length > 0) {
            const newFormData = getInitialFormData(property);
            const newListingType = inferListingTypeFromExistingUnits(existingUnits);
            const newUnits = mapExistingUnitsToFormData(existingUnits);

            setFormData(newFormData);
            setListingType(newListingType);
            setUnits(newUnits);
            setActiveRoomTab(0);
            setDeletedUnitIds([]);
            isInitialMount.current = true; // Reset flag when loading new property
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [propertyId]);

    // Sync units when listing type or bedrooms change
    useEffect(() => {
        // Skip sync on initial mount to preserve loaded data
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const bedroomCount = parseInt(formData.bedrooms) || 1;

        // Force entire_home when bedrooms === 1
        if (bedroomCount === 1 && listingType !== "entire_home") {
            // Use a timeout to avoid setState in effect
            setTimeout(() => setListingType("entire_home"), 0);
            return;
        }

        syncUnits(listingType, bedroomCount);
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
        setUnits([{ ...DEFAULT_UNIT_DATA }]);
        setActiveRoomTab(0);
        setDeletedUnitIds([]);
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
        updateUnit,
        resetForm,
        deletedUnitIds,
    };
}
