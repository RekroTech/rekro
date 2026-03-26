"use client";

import React, { useState, useEffect, useRef } from "react";
import type { PropertyInsert, UnitInsert } from "@/types/db";
import type { AddPropertyModalProps } from "../Property/types";
import { Button, Modal, Loader } from "@/components/common";
import { useCreateProperty, useUpdateProperty, useProperty } from "@/lib/hooks/property";
import { deletePropertyFiles } from "@/lib/services/storage.service";
import { calculateRoomRents, calculateEntireHomeRent } from "@/lib/utils/pricing";
import { usePropertyForm, useMediaFiles } from "./hooks";
import type { PropertyFormData, UnitFormData } from "./types";
import { BasicInformationSection } from "./sections/BasicInformationSection";
import { PropertyDetailsSection } from "./sections/PropertyDetailsSection";
import { ListingDetailsSection } from "./sections/ListingDetailsSection";
import { MediaSection } from "./sections/MediaSection";

const DEFAULT_COUNTRY = "Australia";
const DEFAULT_LISTING_TYPE = "entire_home";
const DEFAULT_UNIT_STATUS = "active";

const toNullableInt = (value: string) => (value ? parseInt(value) : null);
const toNullableFloat = (value: string) => (value ? parseFloat(value) : null);

const buildPropertyPayload = (formData: PropertyFormData) => ({
    description: formData.description || null,
    property_type: formData.property_type || null,
    bedrooms: toNullableInt(formData.bedrooms),
    bathrooms: toNullableInt(formData.bathrooms),
    car_spaces: toNullableInt(formData.car_spaces),
    furnished: formData.furnished,
    bills_included: formData.bills_included,
    amenities: formData.amenities.length > 0 ? formData.amenities : null,
    price: formData.price ? parseInt(formData.price) : 0,
    address: {
        street: formData.address_street,
        city: formData.address_city,
        state: formData.address_state,
        postcode: formData.address_postcode,
        country: formData.address_country,
    },
    location:
        formData.address_city && formData.address_state
            ? {
                  city: formData.address_city,
                  state: formData.address_state,
                  country: formData.address_country || DEFAULT_COUNTRY,
              }
            : null,
    latitude: formData.latitude ?? null,
    longitude: formData.longitude ?? null,
});

const mapUnitToPayload = (unit: UnitFormData): Omit<UnitInsert, "property_id"> => ({
    listing_type: unit.listing_type || DEFAULT_LISTING_TYPE,
    name: unit.name || null,
    description: unit.unit_description || null,
    price: unit.price ? parseInt(unit.price) : 0,
    bond_amount: toNullableInt(unit.bond_amount),
    min_lease: toNullableInt(unit.min_lease),
    max_lease: toNullableInt(unit.max_lease),
    max_occupants: toNullableInt(unit.max_occupants),
    size_sqm: toNullableFloat(unit.size_sqm),
    available_from: unit.available_from || null,
    available_to: unit.available_to || null,
    status: unit.status || DEFAULT_UNIT_STATUS,
    features: unit.listing_type === "room" && unit.features.length > 0 ? unit.features : null,
});

const mapUnitToUpdatePayload = (
    unit: UnitFormData
): Omit<UnitInsert, "property_id"> & { id?: string } => {
    const unitData = mapUnitToPayload(unit);
    return unit.id ? { ...unitData, id: unit.id } : unitData;
};

export function PropertyForm({ isOpen, onClose, onSuccess, propertyId }: AddPropertyModalProps) {
    const [error, setError] = useState<string | null>(null);
    const createProperty = useCreateProperty();
    const updateProperty = useUpdateProperty();
    const isEditMode = !!propertyId;
    const {
        data: property,
        isLoading: isPropertyLoading,
        isError: isPropertyError,
        error: propertyError,
    } = useProperty(propertyId ?? "");
    const existingUnits = property?.units || [];

    // Custom hooks for form state management
    const {
        formData,
        setFormData,
        listingType,
        setListingType,
        activeRoomTab,
        setActiveRoomTab,
        units,
        updateUnit,
        resetForm,
        deletedUnitIds,
    } = usePropertyForm(property, existingUnits);

    const {
        mediaFiles,
        existingImages,
        removedImages,
        existingVideoUrl,
        removeVideo,
        addMediaFiles,
        moveExistingImage,
        moveUploadedFile,
        handleRemoveExistingImage,
        handleRemoveUploadedFile,
        resetMedia,
    } = useMediaFiles(property);

    // Track if we should auto-calculate room prices (only when user changes base price)
    const shouldAutoCalculate = useRef(false);
    const prevPriceRef = useRef(formData.price);
    const prevBedroomsRef = useRef(formData.bedrooms);
    const prevFurnishedRef = useRef(formData.furnished);
    const prevListingTypeRef = useRef(listingType);

    // Auto-calculate unit rents when base price changes
    useEffect(() => {
        // Check if relevant values actually changed
        const priceChanged = prevPriceRef.current !== formData.price;
        const bedroomsChanged = prevBedroomsRef.current !== formData.bedrooms;
        const furnishedChanged = prevFurnishedRef.current !== formData.furnished;
        const listingTypeChanged = prevListingTypeRef.current !== listingType;

        // Update refs
        prevPriceRef.current = formData.price;
        prevBedroomsRef.current = formData.bedrooms;
        prevFurnishedRef.current = formData.furnished;
        prevListingTypeRef.current = listingType;

        // Skip if nothing relevant changed
        if (!priceChanged && !bedroomsChanged && !furnishedChanged && !listingTypeChanged) {
            return;
        }

        // Skip if no base price
        if (!formData.price || parseFloat(formData.price) <= 0) {
            return;
        }

        // Skip on initial mount/load to preserve existing unit prices
        if (!shouldAutoCalculate.current) {
            return;
        }

        const basePrice = parseFloat(formData.price);
        const isFurnished = formData.furnished;

        // Handle entire_home units (12% markup)
        const entireHomeUnits = units.filter((u) => u.listing_type === "entire_home");
        if (entireHomeUnits.length > 0) {
            const entireHomeRent = calculateEntireHomeRent(basePrice);
            entireHomeUnits.forEach((unit) => {
                const unitIndex = units.findIndex((u) => u === unit);
                if (unitIndex !== -1) {
                    const newPrice = entireHomeRent.toString();
                    const newBond = (entireHomeRent * 4).toString();
                    updateUnit(unitIndex, {
                        price: newPrice,
                        bond_amount: newBond,
                    });
                }
            });
        }

        // Handle room units (weighted distribution)
        const roomUnits = units.filter((u) => u.listing_type === "room");
        if (roomUnits.length > 0) {
            const roomMetas = roomUnits.map((unit) => {
                const maxOccupants = parseInt(unit.max_occupants) || 1;
                return {
                    maxCapacity: maxOccupants,
                    sizeSqm: unit.size_sqm ? parseFloat(unit.size_sqm) : undefined,
                };
            });

            // Calculate room rents with weighted distribution
            const roomRents = calculateRoomRents(basePrice, roomMetas, isFurnished);

            // Update room units with calculated prices
            roomUnits.forEach((unit, index) => {
                if (roomRents[index] !== undefined) {
                    const unitIndex = units.findIndex((u) => u === unit);
                    if (unitIndex !== -1) {
                        const newPrice = roomRents[index].toString();
                        const newBond = (roomRents[index] * 4).toString();
                        updateUnit(unitIndex, {
                            price: newPrice,
                            bond_amount: newBond,
                        });
                    }
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.price, formData.bedrooms, formData.furnished, listingType]);

    // Handler for price changes that enables auto-calculation
    const handlePriceChange = (price: string) => {
        shouldAutoCalculate.current = true;
        setFormData({ price });
    };

    const handleClose = () => {
        setError(null);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (isEditMode && (!property || isPropertyLoading || isPropertyError)) {
            setError("Property details are still loading. Please try again.");
            return;
        }

        try {
            if (isEditMode && property) {
                // Delete removed images from storage
                if (removedImages.length > 0) {
                    try {
                        await deletePropertyFiles(removedImages, property.id);
                    } catch (deleteError) {
                        console.error("Error deleting removed images:", deleteError);
                        // Continue with update even if deletion fails
                    }
                }

                // Delete removed video from storage
                if (removeVideo && property.video_url) {
                    try {
                        await deletePropertyFiles([property.video_url], property.id);
                    } catch (deleteError) {
                        console.error("Error deleting removed video:", deleteError);
                        // Continue with update even if deletion fails
                    }
                }

                // Update existing property
                const propertyData: Partial<
                    Omit<
                        PropertyInsert,
                        "id" | "created_at" | "updated_at" | "images" | "video_url" | "created_by"
                    >
                > = buildPropertyPayload(formData);

                // Prepare units data array (all units for update)
                const unitsData = units.map(mapUnitToUpdatePayload);

                await updateProperty.mutateAsync({
                    propertyId: property.id,
                    propertyData,
                    unitsData,
                    mediaFiles,
                    existingImages: existingImages,
                    deletedUnitIds,
                });
            } else {
                // Create new property
                const propertyData: Omit<
                    PropertyInsert,
                    "id" | "created_at" | "updated_at" | "images"
                > = buildPropertyPayload(formData);

                // Prepare units data array
                const unitsData: Omit<UnitInsert, "property_id">[] = units.map(mapUnitToPayload);

                await createProperty.mutateAsync({
                    propertyData,
                    unitsData,
                    mediaFiles,
                });
            }

            // Reset form
            resetForm();
            resetMedia();

            // Call success callback
            if (onSuccess) {
                onSuccess();
            }

            // Close modal
            onClose();
        } catch (err) {
            console.error(`Error ${isEditMode ? "updating" : "adding"} property:`, err);
            setError(
                err instanceof Error
                    ? err.message
                    : `Failed to ${isEditMode ? "update" : "add"} property`
            );
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={isEditMode ? "Edit Property Listing" : "Add Property Listing"}
            size="xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4 px-1 pb-1 pt-1 sm:space-y-6">
                {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
                        <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                )}

                {/* Basic Information */}
                <BasicInformationSection formData={formData} updateFormData={setFormData} />

                {/* Property Details */}
                <PropertyDetailsSection formData={formData} updateFormData={setFormData} />

                {/* Listing Details (Unit Information) */}
                <ListingDetailsSection
                    listingType={listingType}
                    units={units}
                    activeRoomTab={activeRoomTab}
                    bedrooms={formData.bedrooms}
                    price={formData.price}
                    onListingTypeChange={setListingType}
                    onActiveRoomTabChange={setActiveRoomTab}
                    onUpdateUnit={updateUnit}
                    onPriceChange={handlePriceChange}
                />

                {/* Media */}
                <MediaSection
                    mediaFiles={mediaFiles}
                    existingImages={existingImages}
                    existingVideoUrl={existingVideoUrl}
                    removeVideo={removeVideo}
                    property={property}
                    onAddFiles={addMediaFiles}
                    onReorderExistingImage={moveExistingImage}
                    onReorderUploadedFile={moveUploadedFile}
                    onRemoveExistingImage={handleRemoveExistingImage}
                    onRemoveUploadedFile={handleRemoveUploadedFile}
                />

                {/* Form Actions */}
                <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={
                            createProperty.isPending ||
                            updateProperty.isPending ||
                            (isEditMode && (isPropertyLoading || isPropertyError || !property))
                        }
                        className="w-full sm:w-auto"
                    >
                        {updateProperty.isPending || createProperty.isPending ? "Saving" : "Save"}
                    </Button>
                </div>
            </form>

            {isEditMode && isPropertyLoading && (
                <div className="mt-3 rounded-md border border-border bg-card p-3">
                    <Loader size="sm" text="Loading full property details..." />
                </div>
            )}

            {isEditMode && isPropertyError && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2">
                    <p className="text-sm font-medium text-red-800">
                        {propertyError instanceof Error
                            ? propertyError.message
                            : "Failed to load property details for editing."}
                    </p>
                </div>
            )}
        </Modal>
    );
}
