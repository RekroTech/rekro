"use client";

import React, { useState } from "react";
import { Button, Checkbox, Modal, Input, FileUpload, Select } from "@/components/common";
import { useCreateProperty, useUpdateProperty } from "@/lib/react-query/hooks/useProperties";
import { useUser } from "@/lib/react-query/hooks/useAuth";
import { PropertyInsert, Property } from "@/types/db";

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
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const [videoFile, setVideoFile] = useState<File[]>([]);

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

    const propertyTypes = [
        { value: "", label: "Select property type" },
        { value: "house", label: "House" },
        { value: "apartment", label: "Apartment" },
        { value: "townhouse", label: "Townhouse" },
        { value: "villa", label: "Villa" },
        { value: "studio", label: "Studio" },
        { value: "land", label: "Land" },
    ];

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

                await updateProperty.mutateAsync({
                    propertyId: property.id,
                    propertyData,
                    photoFiles,
                    videoFile: videoFile.length > 0 ? videoFile[0] : undefined,
                    userId: user.id,
                    existingImages: Array.isArray(property.images) ? property.images : [],
                    existingVideoUrl: property.video_url || null,
                });
            } else {
                // Create new property
                const propertyData: Omit<
                    PropertyInsert,
                    "id" | "created_at" | "updated_at" | "images" | "video_url"
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
                    is_published: false, // Draft by default
                };

                await createProperty.mutateAsync({
                    propertyData,
                    photoFiles,
                    videoFile: videoFile[0] || null,
                    userId: user.id,
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
            setPhotoFiles([]);
            setVideoFile([]);

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
                            min="0"
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
                    <div className="mb-3">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                            Media
                        </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FileUpload
                            label="Photos"
                            accept="image/*"
                            multiple={true}
                            maxFiles={20}
                            maxSizeMB={10}
                            value={photoFiles}
                            onChange={setPhotoFiles}
                            helperText="Up to 20 photos, max 10MB each"
                        />

                        <FileUpload
                            label="360° Video"
                            accept="video/*"
                            multiple={false}
                            maxFiles={1}
                            maxSizeMB={100}
                            value={videoFile}
                            onChange={setVideoFile}
                            helperText="One video, max 100MB"
                        />
                    </div>
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
