"use client";

import { useState } from "react";
import { Button, Modal, Input, Textarea, Checkbox, Select } from "@/components/common";
import { useSubmitApplication } from "@/lib/react-query/hooks/useApplications";
import { ApplicationType } from "@/types/db";

interface ApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyTitle: string;
    propertyId: string;
    unitId?: string;
    isEntireHome: boolean;
}

export function ApplicationForm({
    isOpen,
    onClose,
    propertyTitle,
    propertyId,
    unitId,
    isEntireHome,
}: ApplicationModalProps) {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        moveInDate: "",
        rentalDuration: "",
        employmentStatus: "",
        incomeSource: "",
        hasPets: false,
        smoker: false,
        additionalInfo: "",
        message: "",
    });

    const submitApplicationMutation = useSubmitApplication();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await submitApplicationMutation.mutateAsync({
                propertyId,
                unitId: unitId || null,
                applicationType: (isEntireHome ? "group" : "individual") as ApplicationType,
                formData,
            });

            // Reset form and close modal on success
            setFormData({
                fullName: "",
                email: "",
                phone: "",
                moveInDate: "",
                rentalDuration: "",
                employmentStatus: "",
                incomeSource: "",
                hasPets: false,
                smoker: false,
                additionalInfo: "",
                message: "",
            });
            onClose();
        } catch (error) {
            console.error("Application submission failed:", error);
            // Error handling - you might want to show a toast notification here
        }
    };

    const isSubmitting = submitApplicationMutation.isPending;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Apply for ${propertyTitle}`} size="xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-text">Personal Information</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="your.email@example.com"
                    />
                </div>

                {/* Tenancy Details */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-text">Tenancy Details</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Desired Move-in Date"
                            type="date"
                            value={formData.moveInDate}
                            onChange={(e) =>
                                setFormData({ ...formData, moveInDate: e.target.value })
                            }
                            required
                        />

                        <Select
                            label="Rental Duration"
                            value={formData.rentalDuration}
                            onChange={(e) =>
                                setFormData({ ...formData, rentalDuration: e.target.value })
                            }
                            options={[
                                { value: "", label: "Select duration" },
                                { value: "3-6 months", label: "3-6 months" },
                                { value: "6-12 months", label: "6-12 months" },
                                { value: "12+ months", label: "12+ months" },
                                { value: "flexible", label: "Flexible" },
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
                            onChange={(e) =>
                                setFormData({ ...formData, incomeSource: e.target.value })
                            }
                            required
                            placeholder="e.g., Salary, Business, Investments"
                        />
                    </div>
                </div>

                {/* Living Preferences */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-text">Living Preferences</h4>

                    <div className="flex gap-6">
                        <Checkbox
                            label="I have pets"
                            checked={formData.hasPets}
                            onChange={(e) =>
                                setFormData({ ...formData, hasPets: e.target.checked })
                            }
                        />

                        <Checkbox
                            label="I am a smoker"
                            checked={formData.smoker}
                            onChange={(e) => setFormData({ ...formData, smoker: e.target.checked })}
                        />
                    </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-text">Additional Information</h4>

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

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        className="flex-1"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Submitting..." : "Submit Application"}
                    </Button>
                </div>

                <p className="text-xs text-text-muted text-center mt-4">
                    Your information will be sent to the property owner for review.
                </p>
            </form>
        </Modal>
    );
}
