"use client";

import React, { useState, useEffect, useRef } from "react";
import { Globe, EyeOff, Trash2 } from "lucide-react";
import type { PropertyInsert, UnitInsert } from "@/types/db";
import type { AddPropertyModalProps } from "../Property/types";
import { Button, Modal, Loader, SegmentedControl } from "@/components/common";
import { useCreateProperty, useUpdateProperty, useProperty, useDeleteProperty } from "@/lib/hooks/property";
import { calculateRoomRents, calculateEntireHomeRent } from "@/lib/utils/pricing";
import { usePropertyForm, useMediaFiles } from "./hooks";
import { BasicInformationSection } from "./sections/BasicInformationSection";
import { PropertyDetailsSection } from "./sections/PropertyDetailsSection";
import { ListingDetailsSection } from "./sections/ListingDetailsSection";
import { MediaSection } from "./sections/MediaSection";

const DEFAULT_COUNTRY = "Australia";
const DEFAULT_LISTING_TYPE = "entire_home";
const DEFAULT_UNIT_STATUS = "active";

export function PropertyForm({ isOpen, onClose, onSuccess, propertyId }: AddPropertyModalProps) {
    const [error, setError] = useState<string | null>(null);
    const [isPublished, setIsPublished] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const createProperty = useCreateProperty();
    const updateProperty = useUpdateProperty();
    const deleteProperty = useDeleteProperty();
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
        addMediaFiles,
        moveExistingImage,
        moveUploadedFile,
        handleRemoveExistingImage,
        handleRemoveUploadedFile,
        resetMedia,
    } = useMediaFiles(property);

    // Sync publish state when property loads in edit mode
    useEffect(() => {
        if (property) {
            setIsPublished(property.is_published ?? false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [property?.id, property?.is_published]);

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

    const buildPropertyPayload = () => {
        const street = formData.address_street.trim() || formData.address_full.trim();
        const city = formData.address_city.trim();
        const state = formData.address_state.trim();
        const postcode = formData.address_postcode.trim();
        const country = formData.address_country.trim() || DEFAULT_COUNTRY;

        const address = { street, city, state, postcode, country };

        const location =
            city || state
                ? { city, state, country }
                : null;

        return {
            description: formData.description || null,
            property_type: formData.property_type || null,
            bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
            bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
            car_spaces: formData.car_spaces ? parseInt(formData.car_spaces) : null,
            furnished: formData.furnished,
            bills_included: formData.bills_included,
            amenities: formData.amenities.length > 0 ? formData.amenities : null,
            price: formData.price ? parseInt(formData.price) : 0,
            address,
            location,
            latitude: formData.latitude ?? null,
            longitude: formData.longitude ?? null,
            is_published: isPublished,
        };
    };

    const handleClose = () => {
        setError(null);
        if (!isEditMode) setIsPublished(false);
        onClose();
    };

    const handleDelete = async () => {
        if (!property) return;
        try {
            await deleteProperty.mutateAsync(property.id);
            setShowDeleteConfirm(false);
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setShowDeleteConfirm(false);
            setError(err instanceof Error ? err.message : "Failed to delete property");
        }
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
                // Update existing property
                const propertyData: Partial<
                    Omit<
                        PropertyInsert,
                        "id" | "created_at" | "updated_at" | "images" | "video_url" | "created_by"
                    >
                > = buildPropertyPayload();

                // Prepare units data array (all units for update)
                const unitsData = units.map((unit) => {
                    const unitData: Omit<UnitInsert, "property_id"> & { id?: string } = {
                        listing_type: unit.listing_type || DEFAULT_LISTING_TYPE,
                        name: unit.name || null,
                        description: unit.unit_description || null,
                        price: unit.price ? parseInt(unit.price) : 0,
                        bond_amount: unit.bond_amount ? parseInt(unit.bond_amount) : null,
                        min_lease: unit.min_lease ? parseInt(unit.min_lease) : null,
                        max_lease: unit.max_lease ? parseInt(unit.max_lease) : null,
                        max_occupants: unit.max_occupants ? parseInt(unit.max_occupants) : null,
                        size_sqm: unit.size_sqm ? parseFloat(unit.size_sqm) : null,
                        available_from: unit.available_from || null,
                        available_to: unit.available_to || null,
                        status: unit.status || DEFAULT_UNIT_STATUS,
                        features:
                            unit.listing_type === "room" && unit.features.length > 0
                                ? unit.features
                                : null,
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
                    existingImages,
                    removedImages,
                    deletedUnitIds,
                });
            } else {
                // Create new property
                const propertyData: Omit<
                    PropertyInsert,
                    "id" | "created_at" | "updated_at" | "images"
                > = buildPropertyPayload();

                // Prepare units data array
                const unitsData: Omit<UnitInsert, "property_id">[] = units.map((unit) => ({
                    listing_type: unit.listing_type || DEFAULT_LISTING_TYPE,
                    name: unit.name || null,
                    description: unit.unit_description || null,
                    price: unit.price ? parseInt(unit.price) : 0,
                    bond_amount: unit.bond_amount ? parseInt(unit.bond_amount) : null,
                    min_lease: unit.min_lease ? parseInt(unit.min_lease) : null,
                    max_lease: unit.max_lease ? parseInt(unit.max_lease) : null,
                    max_occupants: unit.max_occupants ? parseInt(unit.max_occupants) : null,
                    size_sqm: unit.size_sqm ? parseFloat(unit.size_sqm) : null,
                    available_from: unit.available_from || null,
                    available_to: unit.available_to || null,
                    status: unit.status || DEFAULT_UNIT_STATUS,
                    features:
                        unit.listing_type === "room" && unit.features.length > 0
                            ? unit.features
                            : null,
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

                {/* Listing Visibility */}
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-subtle px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-text">Listing Visibility</p>
                    </div>
                    <div className="w-full sm:w-auto">
                        <SegmentedControl<boolean>
                            options={[
                                { value: false, label: "Hidden", icon: EyeOff },
                                { value: true, label: "Published", icon: Globe },
                            ]}
                            value={isPublished}
                            onChange={setIsPublished}
                            ariaLabel="Listing visibility"
                            size="sm"
                        />
                    </div>
                </div>

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
                    property={property}
                    onAddFiles={addMediaFiles}
                    onReorderExistingImage={moveExistingImage}
                    onReorderUploadedFile={moveUploadedFile}
                    onRemoveExistingImage={handleRemoveExistingImage}
                    onRemoveUploadedFile={handleRemoveUploadedFile}
                />

                {/* Form Actions */}
                <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Delete — edit mode only */}
                    {isEditMode ? (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={deleteProperty.isPending || isPropertyLoading}
                            className="w-full border !border-danger-600 !text-danger-600 hover:!bg-danger-50 hover:!text-danger-600 active:!bg-danger-100 focus:!shadow-none focus-visible:!shadow-none sm:w-auto"
                        >
                            <Trash2 size={15} className="mr-1.5" strokeWidth={2} />
                            Delete listing
                        </Button>
                    ) : (
                        <span />
                    )}

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
                        {updateProperty.isPending || createProperty.isPending ? "Saving…" : "Save"}
                    </Button>
                </div>
            </form>

            {/* Delete confirmation modal */}
            <Modal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                title="Delete this listing?"
                size="sm"
                primaryButton={{
                    label: deleteProperty.isPending ? "Deleting…" : "Delete permanently",
                    onClick: handleDelete,
                    variant: "danger",
                    isLoading: deleteProperty.isPending,
                }}
                secondaryButton={{
                    label: "Keep listing",
                    onClick: () => setShowDeleteConfirm(false),
                    variant: "secondary",
                }}
                fullWidthButtons
            >
                <p className="text-sm text-text-muted">
                    This will permanently remove the listing, all its units, and any uploaded
                    images. <span className="font-semibold text-text">This cannot be undone.</span>
                </p>
            </Modal>

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
