"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button, Checkbox, Modal, Input, Select } from "@/components/common";
import {
    useCreateProperty,
    useUpdateProperty,
    useUnits,
} from "@/lib/react-query/hooks/useProperties";
import { useUser } from "@/lib/react-query/hooks/useAuth";
import { PropertyInsert, Property, ListingType } from "@/types/db";
import { deletePropertyFiles, getPropertyFileUrl } from "@/services/storage.service";

export interface AddPropertyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    property?: Property; // For edit mode
}

export function PropertyModal({ isOpen, onClose, onSuccess, property }: AddPropertyModalProps) {
    const [error, setError] = useState<string | null>(null);
    const createProperty = useCreateProperty();
    const updateProperty = useUpdateProperty();
    const { data: user } = useUser();
    const { data: existingUnits = [] } = useUnits(property?.id || "");
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>(
        property?.images && Array.isArray(property.images) ? property.images : []
    );
    const [removedImages, setRemovedImages] = useState<string[]>([]);
    const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(
        property?.video_url || null
    );
    const [removeVideo, setRemoveVideo] = useState(false);

    const isEditMode = !!property;

    // Helper function to parse address
    const parseAddress = (address: unknown) => {
        if (typeof address === "object" && address !== null) {
            const addr = address as Record<string, unknown>;
            return {
                address_street: (addr.street as string) || "",
                address_city: (addr.city as string) || "",
                address_state: (addr.state as string) || "",
                address_postcode: (addr.postcode as string) || "",
                address_country: (addr.country as string) || "Australia",
            };
        }
        return {
            address_street: "",
            address_city: "",
            address_state: "",
            address_postcode: "",
            address_country: "Australia",
        };
    };

    const initialFormData = property
        ? {
              title: property.title || "",
              description: property.description || "",
              property_type: property.property_type || "",
              bedrooms: property.bedrooms?.toString() || "",
              bathrooms: property.bathrooms?.toString() || "",
              car_spaces: property.car_spaces?.toString() || "",
              furnished: property.furnished || false,
              ...parseAddress(property.address),
          }
        : {
              title: "",
              description: "",
              property_type: "",
              bedrooms: "",
              bathrooms: "",
              car_spaces: "",
              furnished: false,
              address_street: "",
              address_city: "",
              address_state: "",
              address_postcode: "",
              address_country: "Australia",
          };

    const [formData, setFormData] = useState(initialFormData);
    const [listingType, setListingType] = useState<"entire_home" | "room">("entire_home");
    const [activeRoomTab, setActiveRoomTab] = useState(0);

    // Initialize units array based on listing type
    const getInitialUnits = () => {
        const bedroomCount = parseInt(formData.bedrooms) || 1;
        const count = listingType === "room" ? Math.max(1, bedroomCount) : 1;

        return Array.from({ length: count }, (_, index) => ({
            name: listingType === "room" ? `Room ${index + 1}` : "",
            unit_description: "",
            price_per_week: "",
            bond_amount: "",
            bills_included: false,
            min_lease_weeks: "",
            max_lease_weeks: "",
            max_occupants: listingType === "room" ? "1" : "",
            size_sqm: "",
        }));
    };

    const [units, setUnits] = useState(getInitialUnits());

    const propertyTypes = [
        { value: "", label: "Select property type" },
        { value: "house", label: "House" },
        { value: "apartment", label: "Apartment" },
        { value: "townhouse", label: "Townhouse" },
        { value: "villa", label: "Villa" },
        { value: "studio", label: "Studio" },
        { value: "land", label: "Land" },
    ];

    const listingTypes = [
        { value: "entire_home", label: "Entire Home (Whole Property)" },
        { value: "room", label: "Room (Shared/Single Room)" },
    ];

    // Update state when modal opens or property changes
    useEffect(() => {
        if (!isOpen) return;

        if (property) {
            setExistingImages(
                property.images && Array.isArray(property.images) ? property.images : []
            );
            setExistingVideoUrl(property.video_url || null);
            setRemovedImages([]);
            setRemoveVideo(false);
            setFormData({
                title: property.title || "",
                description: property.description || "",
                property_type: property.property_type || "",
                bedrooms: property.bedrooms?.toString() || "",
                bathrooms: property.bathrooms?.toString() || "",
                car_spaces: property.car_spaces?.toString() || "",
                furnished: property.furnished || false,
                ...parseAddress(property.address),
            });
            // Set listing type and units data if they exist
            if (existingUnits && existingUnits.length > 0) {
                setListingType(existingUnits[0].listing_type || "entire_home");
                setUnits(
                    existingUnits.map((unit) => ({
                        name: unit.name || "",
                        unit_description: unit.description || "",
                        price_per_week: unit.price_per_week?.toString() || "",
                        bond_amount: unit.bond_amount?.toString() || "",
                        bills_included: unit.bills_included || false,
                        min_lease_weeks: unit.min_lease_weeks?.toString() || "",
                        max_lease_weeks: unit.max_lease_weeks?.toString() || "",
                        max_occupants: unit.max_occupants?.toString() || "",
                        size_sqm: unit.size_sqm?.toString() || "",
                    }))
                );
            }
        } else {
            // Reset for new property
            setExistingImages([]);
            setExistingVideoUrl(null);
            setRemovedImages([]);
            setRemoveVideo(false);
            setFormData({
                title: "",
                description: "",
                property_type: "",
                bedrooms: "",
                bathrooms: "",
                car_spaces: "",
                furnished: false,
                address_street: "",
                address_city: "",
                address_state: "",
                address_postcode: "",
                address_country: "Australia",
            });
            setListingType("entire_home");
            setUnits(getInitialUnits());
        }
        setMediaFiles([]);
        setError(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, property?.id, existingUnits]);

    // Update units array when listing type or bedrooms change
    useEffect(() => {
        const bedroomCount = parseInt(formData.bedrooms) || 1;
        const requiredCount = listingType === "room" ? Math.max(1, bedroomCount) : 1;

        if (units.length !== requiredCount) {
            const newUnits = Array.from({ length: requiredCount }, (_, index) => {
                // Preserve existing data if available
                if (units[index]) {
                    return units[index];
                }
                // Create new unit with defaults
                return {
                    name: listingType === "room" ? `Room ${index + 1}` : "",
                    unit_description: "",
                    price_per_week: "",
                    bond_amount: "",
                    bills_included: false,
                    min_lease_weeks: "",
                    max_lease_weeks: "",
                    max_occupants: listingType === "room" ? "1" : "",
                    size_sqm: "",
                };
            });
            setUnits(newUnits);
            // Reset active tab to 0 when units array changes
            setActiveRoomTab(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listingType, formData.bedrooms]);

    const handleRemoveExistingImage = (imageUrl: string) => {
        setRemovedImages([...removedImages, imageUrl]);
        setExistingImages(existingImages.filter((img) => img !== imageUrl));
    };

    const handleRemoveUploadedFile = (index: number) => {
        setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    };

    const isVideoFile = (file: File) => file.type.startsWith("video/");

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
                    address: {
                        street: formData.address_street,
                        city: formData.address_city,
                        state: formData.address_state,
                        postcode: formData.address_postcode,
                        country: formData.address_country,
                    },
                };

                // Prepare units data array (all units for update)
                const unitsData = units.map((unit) => ({
                    listing_type: listingType as ListingType,
                    name: unit.name || null,
                    description: unit.unit_description || null,
                    price_per_week: unit.price_per_week ? parseInt(unit.price_per_week) : 0,
                    bond_amount: unit.bond_amount ? parseInt(unit.bond_amount) : null,
                    bills_included: unit.bills_included,
                    min_lease_weeks: unit.min_lease_weeks ? parseInt(unit.min_lease_weeks) : null,
                    max_lease_weeks: unit.max_lease_weeks ? parseInt(unit.max_lease_weeks) : null,
                    max_occupants: unit.max_occupants ? parseInt(unit.max_occupants) : null,
                    size_sqm: unit.size_sqm ? parseFloat(unit.size_sqm) : null,
                }));

                await updateProperty.mutateAsync({
                    propertyId: property.id,
                    propertyData,
                    unitsData,
                    mediaFiles,
                    existingImages: existingImages,
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
                    address: {
                        street: formData.address_street,
                        city: formData.address_city,
                        state: formData.address_state,
                        postcode: formData.address_postcode,
                        country: formData.address_country,
                    },
                    created_by: user.id,
                    is_published: false,
                };

                // Prepare units data array
                const unitsData = units.map((unit) => ({
                    listing_type: listingType as ListingType,
                    name: unit.name || null,
                    description: unit.unit_description || null,
                    price_per_week: unit.price_per_week ? parseInt(unit.price_per_week) : 0,
                    bond_amount: unit.bond_amount ? parseInt(unit.bond_amount) : null,
                    bills_included: unit.bills_included,
                    min_lease_weeks: unit.min_lease_weeks ? parseInt(unit.min_lease_weeks) : null,
                    max_lease_weeks: unit.max_lease_weeks ? parseInt(unit.max_lease_weeks) : null,
                    max_occupants: unit.max_occupants ? parseInt(unit.max_occupants) : null,
                    size_sqm: unit.size_sqm ? parseFloat(unit.size_sqm) : null,
                }));

                await createProperty.mutateAsync({
                    propertyData,
                    unitsData,
                    mediaFiles,
                });
            }

            // Reset form
            setFormData({
                title: "",
                description: "",
                property_type: "",
                bedrooms: "",
                bathrooms: "",
                car_spaces: "",
                furnished: false,
                address_street: "",
                address_city: "",
                address_state: "",
                address_postcode: "",
                address_country: "Australia",
            });
            setListingType("entire_home");
            setUnits(getInitialUnits());
            setMediaFiles([]);

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
            onClose={onClose}
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
                <section className="rounded-lg border border-gray-200 bg-white/80 p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                                Basic Information
                            </h4>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Property Title"
                                type="text"
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData({ ...formData, title: e.target.value })
                                }
                                placeholder="e.g., Modern 3-Bedroom House in Suburb"
                                required
                            />

                            <Select
                                label="Property Type"
                                value={formData.property_type}
                                onChange={(e) =>
                                    setFormData({ ...formData, property_type: e.target.value })
                                }
                                options={propertyTypes}
                                required
                            />
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                label="Furnished"
                                checked={formData.furnished}
                                onChange={(e) =>
                                    setFormData({ ...formData, furnished: e.target.checked })
                                }
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                placeholder="Describe the property, key features and nearby amenities..."
                                rows={4}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/80"
                            />
                            <p className="mt-1 text-xs text-gray-400">
                                Highlight what makes this property unique.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Property Details */}
                <section className="rounded-lg border border-gray-200 bg-white/80 p-4 shadow-sm">
                    <div className="mb-3">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                            Property Details
                        </h4>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <Input
                            label="Bedrooms"
                            type="number"
                            value={formData.bedrooms}
                            onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                            placeholder="0"
                            min={listingType === "room" ? "1" : "0"}
                        />

                        <Input
                            label="Bathrooms"
                            type="number"
                            value={formData.bathrooms}
                            onChange={(e) =>
                                setFormData({ ...formData, bathrooms: e.target.value })
                            }
                            placeholder="0"
                            min="0"
                        />

                        <Input
                            label="Car Spaces"
                            type="number"
                            value={formData.car_spaces}
                            onChange={(e) =>
                                setFormData({ ...formData, car_spaces: e.target.value })
                            }
                            placeholder="0"
                            min="0"
                        />
                    </div>
                </section>

                {/* Listing Details (Unit Information) */}
                <section className="rounded-lg border border-gray-200 bg-white/80 p-4 shadow-sm">
                    <div className="mb-3">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                            Listing Details
                        </h4>
                    </div>

                    <div className="space-y-4">
                        {/* Listing Type Selection */}
                        <Select
                            label="Listing Type"
                            value={listingType}
                            onChange={(e) =>
                                setListingType(e.target.value as "entire_home" | "room")
                            }
                            options={listingTypes}
                            required
                        />

                        {/* Tab Navigation for Rooms */}
                        {listingType === "room" && units.length > 1 && (
                            <div className="border-b border-gray-200">
                                <div className="flex gap-1 overflow-x-auto">
                                    {units.map((unit, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => setActiveRoomTab(index)}
                                            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                                                activeRoomTab === index
                                                    ? "border-primary-500 text-primary-600"
                                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                            }`}
                                        >
                                            {unit.name || `Room ${index + 1}`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Dynamic Unit Forms */}
                        {listingType === "room" ? (
                            // Show only the active tab's form for room listings
                            <div className="space-y-4 rounded-md border border-gray-200 bg-gray-50/50 p-4">
                                {(() => {
                                    const index = activeRoomTab;
                                    const unit = units[index];

                                    return (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input
                                                    label="Room Name"
                                                    type="text"
                                                    value={unit.name}
                                                    onChange={(e) => {
                                                        const newUnits = [...units];
                                                        newUnits[index] = {
                                                            ...newUnits[index],
                                                            name: e.target.value,
                                                        };
                                                        setUnits(newUnits);
                                                    }}
                                                    placeholder={`Room ${index + 1}`}
                                                />

                                                <Input
                                                    label="Price per Week"
                                                    type="number"
                                                    value={unit.price_per_week}
                                                    onChange={(e) => {
                                                        const newUnits = [...units];
                                                        newUnits[index] = {
                                                            ...newUnits[index],
                                                            price_per_week: e.target.value,
                                                        };
                                                        setUnits(newUnits);
                                                    }}
                                                    placeholder="0"
                                                    min="0"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                                    Unit Description (Optional)
                                                </label>
                                                <textarea
                                                    value={unit.unit_description}
                                                    onChange={(e) => {
                                                        const newUnits = [...units];
                                                        newUnits[index] = {
                                                            ...newUnits[index],
                                                            unit_description: e.target.value,
                                                        };
                                                        setUnits(newUnits);
                                                    }}
                                                    placeholder="Additional details about this specific room..."
                                                    rows={2}
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/80"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <Input
                                                    label="Bond Amount"
                                                    type="number"
                                                    value={unit.bond_amount}
                                                    onChange={(e) => {
                                                        const newUnits = [...units];
                                                        newUnits[index] = {
                                                            ...newUnits[index],
                                                            bond_amount: e.target.value,
                                                        };
                                                        setUnits(newUnits);
                                                    }}
                                                    placeholder="0"
                                                    min="0"
                                                />

                                                <Input
                                                    label="Max Occupants"
                                                    type="number"
                                                    value={unit.max_occupants}
                                                    onChange={(e) => {
                                                        const newUnits = [...units];
                                                        newUnits[index] = {
                                                            ...newUnits[index],
                                                            max_occupants: e.target.value,
                                                        };
                                                        setUnits(newUnits);
                                                    }}
                                                    placeholder="0"
                                                    min="0"
                                                />
                                            </div>

                                            <div className="grid grid-cols-3 gap-4">
                                                <Input
                                                    label="Min Lease (weeks)"
                                                    type="number"
                                                    value={unit.min_lease_weeks}
                                                    onChange={(e) => {
                                                        const newUnits = [...units];
                                                        newUnits[index] = {
                                                            ...newUnits[index],
                                                            min_lease_weeks: e.target.value,
                                                        };
                                                        setUnits(newUnits);
                                                    }}
                                                    placeholder="0"
                                                    min="0"
                                                />

                                                <Input
                                                    label="Max Lease (weeks)"
                                                    type="number"
                                                    value={unit.max_lease_weeks}
                                                    onChange={(e) => {
                                                        const newUnits = [...units];
                                                        newUnits[index] = {
                                                            ...newUnits[index],
                                                            max_lease_weeks: e.target.value,
                                                        };
                                                        setUnits(newUnits);
                                                    }}
                                                    placeholder="0"
                                                    min="0"
                                                />

                                                <Input
                                                    label="Size (sqm)"
                                                    type="number"
                                                    value={unit.size_sqm}
                                                    onChange={(e) => {
                                                        const newUnits = [...units];
                                                        newUnits[index] = {
                                                            ...newUnits[index],
                                                            size_sqm: e.target.value,
                                                        };
                                                        setUnits(newUnits);
                                                    }}
                                                    placeholder="0"
                                                    min="0"
                                                    step="0.1"
                                                />
                                            </div>

                                            <div className="flex items-center">
                                                <Checkbox
                                                    label="Bills Included"
                                                    checked={unit.bills_included}
                                                    onChange={(e) => {
                                                        const newUnits = [...units];
                                                        newUnits[index] = {
                                                            ...newUnits[index],
                                                            bills_included: e.target.checked,
                                                        };
                                                        setUnits(newUnits);
                                                    }}
                                                />
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        ) : (
                            // Show single form for entire home
                            units.map((unit, index) => (
                                <div
                                    key={index}
                                    className="space-y-4 rounded-md border border-gray-200 bg-gray-50/50 p-4"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Unit/Room Name (Optional)"
                                            type="text"
                                            value={unit.name}
                                            onChange={(e) => {
                                                const newUnits = [...units];
                                                newUnits[index] = {
                                                    ...newUnits[index],
                                                    name: e.target.value,
                                                };
                                                setUnits(newUnits);
                                            }}
                                            placeholder="e.g., Master Bedroom, Unit 1A"
                                        />

                                        <Input
                                            label="Price per Week"
                                            type="number"
                                            value={unit.price_per_week}
                                            onChange={(e) => {
                                                const newUnits = [...units];
                                                newUnits[index] = {
                                                    ...newUnits[index],
                                                    price_per_week: e.target.value,
                                                };
                                                setUnits(newUnits);
                                            }}
                                            placeholder="0"
                                            min="0"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Unit Description (Optional)
                                        </label>
                                        <textarea
                                            value={unit.unit_description}
                                            onChange={(e) => {
                                                const newUnits = [...units];
                                                newUnits[index] = {
                                                    ...newUnits[index],
                                                    unit_description: e.target.value,
                                                };
                                                setUnits(newUnits);
                                            }}
                                            placeholder="Additional details about this specific listing..."
                                            rows={2}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/80"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Bond Amount"
                                            type="number"
                                            value={unit.bond_amount}
                                            onChange={(e) => {
                                                const newUnits = [...units];
                                                newUnits[index] = {
                                                    ...newUnits[index],
                                                    bond_amount: e.target.value,
                                                };
                                                setUnits(newUnits);
                                            }}
                                            placeholder="0"
                                            min="0"
                                        />

                                        <Input
                                            label="Max Occupants"
                                            type="number"
                                            value={unit.max_occupants}
                                            onChange={(e) => {
                                                const newUnits = [...units];
                                                newUnits[index] = {
                                                    ...newUnits[index],
                                                    max_occupants: e.target.value,
                                                };
                                                setUnits(newUnits);
                                            }}
                                            placeholder="0"
                                            min="0"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <Input
                                            label="Min Lease (weeks)"
                                            type="number"
                                            value={unit.min_lease_weeks}
                                            onChange={(e) => {
                                                const newUnits = [...units];
                                                newUnits[index] = {
                                                    ...newUnits[index],
                                                    min_lease_weeks: e.target.value,
                                                };
                                                setUnits(newUnits);
                                            }}
                                            placeholder="0"
                                            min="0"
                                        />

                                        <Input
                                            label="Max Lease (weeks)"
                                            type="number"
                                            value={unit.max_lease_weeks}
                                            onChange={(e) => {
                                                const newUnits = [...units];
                                                newUnits[index] = {
                                                    ...newUnits[index],
                                                    max_lease_weeks: e.target.value,
                                                };
                                                setUnits(newUnits);
                                            }}
                                            placeholder="0"
                                            min="0"
                                        />

                                        <Input
                                            label="Size (sqm)"
                                            type="number"
                                            value={unit.size_sqm}
                                            onChange={(e) => {
                                                const newUnits = [...units];
                                                newUnits[index] = {
                                                    ...newUnits[index],
                                                    size_sqm: e.target.value,
                                                };
                                                setUnits(newUnits);
                                            }}
                                            placeholder="0"
                                            min="0"
                                            step="0.1"
                                        />
                                    </div>

                                    <div className="flex items-center">
                                        <Checkbox
                                            label="Bills Included"
                                            checked={unit.bills_included}
                                            onChange={(e) => {
                                                const newUnits = [...units];
                                                newUnits[index] = {
                                                    ...newUnits[index],
                                                    bills_included: e.target.checked,
                                                };
                                                setUnits(newUnits);
                                            }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Address */}
                <section className="rounded-lg border border-gray-200 bg-white/80 p-4 shadow-sm">
                    <div className="mb-3">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                            Address
                        </h4>
                    </div>

                    <div className="space-y-4">
                        <Input
                            label="Street Address"
                            type="text"
                            value={formData.address_street}
                            onChange={(e) =>
                                setFormData({ ...formData, address_street: e.target.value })
                            }
                            placeholder="e.g., 123 Main Street"
                        />

                        <div className="grid grid-cols-3 gap-4">
                            <Input
                                label="City/Suburb"
                                type="text"
                                value={formData.address_city}
                                onChange={(e) =>
                                    setFormData({ ...formData, address_city: e.target.value })
                                }
                                placeholder="e.g., Sydney"
                            />

                            <Input
                                label="State"
                                type="text"
                                value={formData.address_state}
                                onChange={(e) =>
                                    setFormData({ ...formData, address_state: e.target.value })
                                }
                                placeholder="e.g., NSW"
                            />

                            <Input
                                label="Postcode"
                                type="text"
                                value={formData.address_postcode}
                                onChange={(e) =>
                                    setFormData({ ...formData, address_postcode: e.target.value })
                                }
                                placeholder="e.g., 2000"
                            />
                        </div>
                    </div>
                </section>

                {/* Media */}
                <section className="rounded-lg border border-gray-200 bg-white/80 p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                            Media
                        </h4>
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    setMediaFiles([...mediaFiles, ...files]);
                                    e.target.value = ""; // Reset input
                                }}
                            />
                            <div className="flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                Add Media
                            </div>
                        </label>
                    </div>

                    {/* Media Grid - Shows both existing and new files */}
                    {(existingImages.length > 0 ||
                        (existingVideoUrl && !removeVideo) ||
                        mediaFiles.length > 0) && (
                        <div className="grid grid-cols-4 gap-3">
                            {/* Existing Images */}
                            {existingImages.map((imageUrl, index) => (
                                <div
                                    key={`existing-img-${index}`}
                                    className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                                >
                                    <Image
                                        src={getPropertyFileUrl(imageUrl, property?.id)}
                                        alt={`Property ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 25vw, 20vw"
                                    />
                                    <div className="absolute left-2 top-2 rounded bg-blue-500 px-2 py-0.5 text-xs font-medium text-white">
                                        Current
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveExistingImage(imageUrl)}
                                        className="absolute right-1 top-1 z-10 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-colors hover:bg-red-600"
                                        title="Remove image"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            ))}

                            {/* New Uploaded Files */}
                            {mediaFiles.map((file, index) => (
                                <div
                                    key={`new-${index}`}
                                    className="relative aspect-square overflow-hidden rounded-lg border-2 border-dashed border-primary-300 bg-gray-50"
                                >
                                    {isVideoFile(file) ? (
                                        <>
                                            <video
                                                src={URL.createObjectURL(file)}
                                                className="h-full w-full object-cover"
                                            />
                                            <div className="absolute left-2 top-2 rounded bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                                                New Video
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Image
                                                src={URL.createObjectURL(file)}
                                                alt={file.name}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 25vw, 20vw"
                                            />
                                            <div className="absolute left-2 top-2 rounded bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                                                New
                                            </div>
                                        </>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveUploadedFile(index)}
                                        className="absolute right-1 top-1 z-10 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-colors hover:bg-red-600"
                                        title="Remove file"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Helper Text */}
                    <p className="mt-3 text-xs text-gray-500">
                        Upload photos and videos. Images max 10MB each, videos max 50MB.
                    </p>
                </section>

                {/* Form Actions */}
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <p className="text-xs text-gray-400">
                        You can edit and publish this listing later from your dashboard.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
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
