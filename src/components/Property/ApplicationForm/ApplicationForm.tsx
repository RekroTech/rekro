"use client";

import React, { useState } from "react";
import { Button, Input, Textarea, Checkbox, Select, Icon } from "@/components/common";
import { useSubmitApplication } from "@/lib/react-query/hooks/application/useApplications";
import { ApplicationType } from "@/types/db";
import { DEFAULT_FORM_DATA } from "@/components/Property/ApplicationForm/constants";

interface ApplicationFormProps {
    propertyId: string;
    unitId?: string;
    isEntireHome: boolean;
    onSuccess: () => void;
    onCancel: () => void;
    additionalInfo?: string;
    showBackButton?: boolean;
    onBack?: () => void;
    initialMoveInDate?: string;
    initialRentalDuration?: string;
}

export function ApplicationForm({
    propertyId,
    unitId,
    isEntireHome,
    onSuccess,
    onCancel,
    additionalInfo = "",
    showBackButton = false,
    onBack,
    initialMoveInDate = "",
    initialRentalDuration = "",
}: ApplicationFormProps) {
    const [formData, setFormData] = useState({
        ...DEFAULT_FORM_DATA,
        moveInDate: initialMoveInDate,
        rentalDuration: initialRentalDuration,
    });

    const submitApplicationMutation = useSubmitApplication();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await submitApplicationMutation.mutateAsync({
                propertyId,
                unitId: unitId || null,
                applicationType: (isEntireHome ? "group" : "individual") as ApplicationType,
                formData: {
                    ...formData,
                    additionalInfo: additionalInfo
                        ? `${formData.additionalInfo}\n\n${additionalInfo}`
                        : formData.additionalInfo,
                },
            });

            // Reset form and close modal on success
            setFormData(DEFAULT_FORM_DATA);
            onSuccess();
        } catch (error) {
            console.error("Application submission failed:", error);
            // Error handling - you might want to show a toast notification here
        }
    };

    const isSubmitting = submitApplicationMutation.isPending;

    return (
        <form onSubmit={handleSubmit}>
            {/* Personal Information */}
            <div className="mb-4 sm:mb-6">
                <h4 className="font-semibold text-text mb-3 sm:mb-4">Personal Information</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <Input
                        label="Full Name"
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        placeholder="Enter your full name"
                    />

                    <Input
                        label="Phone Number"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        placeholder="+1 (555) 123-4567"
                    />
                </div>

                <div className="mt-3 sm:mt-4">
                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="your.email@example.com"
                    />
                </div>
            </div>

            {/* Tenancy Details */}
            <div className="mb-4 sm:mb-6">
                <h4 className="font-semibold text-text mb-3 sm:mb-4">Tenancy Details</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <Input
                        label="Preferred Start Date"
                        type="date"
                        value={formData.moveInDate}
                        onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                        required
                    />

                    <Select
                        label="Lease Period"
                        value={formData.rentalDuration}
                        onChange={(e) =>
                            setFormData({ ...formData, rentalDuration: e.target.value })
                        }
                        options={[
                            { value: "", label: "Select lease period" },
                            { value: "4", label: "4 months" },
                            { value: "6", label: "6 months" },
                            { value: "9", label: "9 months" },
                            { value: "12", label: "12 months" },
                        ]}
                        required
                    />

                    <Input
                        label="Employment Status"
                        type="text"
                        value={formData.employmentStatus}
                        onChange={(e) =>
                            setFormData({ ...formData, employmentStatus: e.target.value })
                        }
                        required
                        placeholder="e.g., Full-time, Part-time, Student, Self-employed"
                    />

                    <Input
                        label="Income Source"
                        type="text"
                        value={formData.incomeSource}
                        onChange={(e) => setFormData({ ...formData, incomeSource: e.target.value })}
                        required
                        placeholder="e.g., Salary, Business, Investments"
                    />
                </div>
            </div>

            {/* Living Preferences */}
            <div className="mb-4 sm:mb-6">
                <h4 className="font-semibold text-text mb-3 sm:mb-4">Living Preferences</h4>

                <div className="flex gap-4 sm:gap-6">
                    <Checkbox
                        label="I have pets"
                        checked={formData.hasPets}
                        onChange={(e) => setFormData({ ...formData, hasPets: e.target.checked })}
                    />

                    <Checkbox
                        label="I am a smoker"
                        checked={formData.smoker}
                        onChange={(e) => setFormData({ ...formData, smoker: e.target.checked })}
                    />
                </div>
            </div>

            {/* Additional Information */}
            <div className="mb-4 sm:mb-6">
                <h4 className="font-semibold text-text mb-3 sm:mb-4">Additional Information</h4>

                <div className="flex flex-col gap-3 sm:gap-4">
                    <Textarea
                        label="Message to Landlord"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Introduce yourself and explain why you'd be a great tenant"
                        rows={3}
                    />

                    <Textarea
                        label="Additional Notes"
                        value={formData.additionalInfo}
                        onChange={(e) =>
                            setFormData({ ...formData, additionalInfo: e.target.value })
                        }
                        placeholder="Any additional information you'd like to share"
                        rows={3}
                    />
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center sm:justify-between pt-0 sm:pt-4 gap-2">
                {showBackButton && onBack ? (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onBack}
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-none"
                    >
                        <Icon name="chevron-left" className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                ) : (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-none"
                    >
                        Cancel
                    </Button>
                )}
                <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none"
                >
                    {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
            </div>

            <p className="text-xs text-text-muted text-center mt-3 sm:mt-4">
                Your information will be sent to the property owner for review.
            </p>
        </form>
    );
}
