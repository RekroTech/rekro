import React, { useState, useEffect, useRef } from "react";
import type { PropertyInsert, UnitInsert } from "@/types/db";
import type { AddPropertyModalProps } from "../types";
import { Button, Modal } from "@/components/common";
import { useCreateProperty, useUpdateProperty } from "@/lib/react-query/hooks/property";
import { deletePropertyFiles } from "@/lib/services/storage.service";
import { usePropertyForm, useMediaFiles } from "../hooks";
import { BasicInformationSection } from "./BasicInformationSection";
import { PropertyDetailsSection } from "./PropertyDetailsSection";
import { ListingDetailsSection } from "./ListingDetailsSection";
import { MediaSection } from "./MediaSection";
import { calculateRoomRents, calculateEntireHomeRent } from "../pricing";

export function PropertyForm({ isOpen, onClose, onSuccess, property }: AddPropertyModalProps) {
    const [error, setError] = useState<string | null>(null);
    const createProperty = useCreateProperty();
    const updateProperty = useUpdateProperty();
    const existingUnits = property?.units || [];

    // Custom hooks for form state management
    const {
        isEditMode,
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
                > = {
                    title: formData.title,
                    description: formData.description || null,
                    property_type: formData.property_type || null,
                    bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
                    bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
                    car_spaces: formData.car_spaces ? parseInt(formData.car_spaces) : null,
                    furnished: formData.furnished,
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
                                  country: formData.address_country || "Australia",
                              }
                            : null,
                    latitude: formData.latitude ?? null,
                    longitude: formData.longitude ?? null,
                };

                // Prepare units data array (all units for update)
                const unitsData = units.map((unit) => {
                    const unitData: Omit<UnitInsert, "property_id"> & { id?: string } = {
                        listing_type: unit.listing_type || "entire_home",
                        name: unit.name || null,
                        description: unit.unit_description || null,
                        price: unit.price ? parseInt(unit.price) : 0,
                        bond_amount: unit.bond_amount ? parseInt(unit.bond_amount) : null,
                        bills_included: unit.bills_included,
                        min_lease: unit.min_lease ? parseInt(unit.min_lease) : null,
                        max_lease: unit.max_lease ? parseInt(unit.max_lease) : null,
                        max_occupants: unit.max_occupants ? parseInt(unit.max_occupants) : null,
                        size_sqm: unit.size_sqm ? parseFloat(unit.size_sqm) : null,
                        available_from: unit.available_from || null,
                        available_to: unit.available_to || null,
                        is_available: unit.is_available ?? true,
                    };

                    // Only include id if it exists (for UPDATE), otherwise omit it (for CREATE)
                    if (unit.id) {
                        unitData.id = unit.id;
                    }

                    return unitData;
                });

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
                > = {
                    title: formData.title,
                    description: formData.description || null,
                    property_type: formData.property_type || null,
                    bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
                    bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
                    car_spaces: formData.car_spaces ? parseInt(formData.car_spaces) : null,
                    furnished: formData.furnished,
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
                                  country: formData.address_country || "Australia",
                              }
                            : null,
                    latitude: formData.latitude ?? null,
                    longitude: formData.longitude ?? null,
                    is_published: false,
                };

                // Prepare units data array
                const unitsData: Omit<UnitInsert, "property_id">[] = units.map((unit) => ({
                    listing_type: unit.listing_type || "entire_home",
                    name: unit.name || null,
                    description: unit.unit_description || null,
                    price: unit.price ? parseInt(unit.price) : 0,
                    bond_amount: unit.bond_amount ? parseInt(unit.bond_amount) : null,
                    bills_included: unit.bills_included,
                    min_lease: unit.min_lease ? parseInt(unit.min_lease) : null,
                    max_lease: unit.max_lease ? parseInt(unit.max_lease) : null,
                    max_occupants: unit.max_occupants ? parseInt(unit.max_occupants) : null,
                    size_sqm: unit.size_sqm ? parseFloat(unit.size_sqm) : null,
                    available_from: unit.available_from || null,
                    available_to: unit.available_to || null,
                    is_available: unit.is_available ?? true,
                }));

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
                    onRemoveExistingImage={handleRemoveExistingImage}
                    onRemoveUploadedFile={handleRemoveUploadedFile}
                />

                {/* Form Actions */}
                <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={createProperty.isPending || updateProperty.isPending}
                        className="w-full sm:w-auto"
                    >
                        {updateProperty.isPending || createProperty.isPending ? "Saving" : "Save"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
