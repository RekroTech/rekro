import React, { useState } from "react";
import type { PropertyInsert } from "@/types/db";
import type { AddPropertyModalProps } from "../types";
import { Button, Modal } from "@/components/common";
import { useCreateProperty, useUpdateProperty } from "@/lib/react-query/hooks/property";
import { useUser } from "@/lib/react-query/hooks/auth/useAuth";
import { deletePropertyFiles } from "@/services/storage.service";
import { usePropertyForm, useMediaFiles } from "../hooks";
import { BasicInformationSection } from "./BasicInformationSection";
import { PropertyDetailsSection } from "./PropertyDetailsSection";
import { ListingDetailsSection } from "./ListingDetailsSection";
import { MediaSection } from "./MediaSection";

export function PropertyForm({ isOpen, onClose, onSuccess, property }: AddPropertyModalProps) {
    const [error, setError] = useState<string | null>(null);
    const createProperty = useCreateProperty();
    const updateProperty = useUpdateProperty();
    const { data: user } = useUser();
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

    const handleClose = () => {
        setError(null);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Check if user is logged in
        if (!user) {
            setError("You must be logged in to add a property");
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
                > = {
                    title: formData.title,
                    description: formData.description || null,
                    property_type: formData.property_type || null,
                    bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
                    bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
                    car_spaces: formData.car_spaces ? parseInt(formData.car_spaces) : null,
                    furnished: formData.furnished,
                    amenities: formData.amenities.length > 0 ? formData.amenities : null,
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
                    const unitData: {
                        id?: string;
                        listing_type: "entire_home" | "room";
                        name?: string | null;
                        description?: string | null;
                        price_per_week: number;
                        bond_amount?: number | null;
                        bills_included?: boolean | null;
                        min_lease?: number | null;
                        max_lease?: number | null;
                        max_occupants?: number | null;
                        size_sqm?: number | null;
                        available_from?: string | null;
                        available_to?: string | null;
                        is_available?: boolean;
                    } = {
                        listing_type: unit.listing_type || "entire_home",
                        name: unit.name || null,
                        description: unit.unit_description || null,
                        price_per_week: unit.price_per_week ? parseInt(unit.price_per_week) : 0,
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
                    created_by: user.id,
                    is_published: false,
                };

                // Prepare units data array
                const unitsData = units.map((unit) => ({
                    listing_type: unit.listing_type || "entire_home",
                    name: unit.name || null,
                    description: unit.unit_description || null,
                    price_per_week: unit.price_per_week ? parseInt(unit.price_per_week) : 0,
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
            <form onSubmit={handleSubmit} className="space-y-6 px-1 pb-1 pt-1">
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
                    onListingTypeChange={setListingType}
                    onActiveRoomTabChange={setActiveRoomTab}
                    onUpdateUnit={updateUnit}
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
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <p className="text-xs text-gray-400">
                        You can edit and publish this listing later from your dashboard.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={createProperty.isPending || updateProperty.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={createProperty.isPending || updateProperty.isPending}
                        >
                            {isEditMode
                                ? updateProperty.isPending
                                    ? "Updating..."
                                    : "Update Property"
                                : createProperty.isPending
                                  ? "Adding..."
                                  : "Add Property"}
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
