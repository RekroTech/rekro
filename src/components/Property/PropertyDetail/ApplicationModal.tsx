"use client";

import { useState } from "react";
import { Button, Modal, Input, Textarea } from "@/components/common";

interface ApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyTitle: string;
    propertyId: string;
    unitId?: string;
    isEntireHome: boolean;
}

export function ApplicationModal({
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
        employmentStatus: "",
        annualIncome: "",
        references: "",
        additionalInfo: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // TODO: Implement application submission
        console.log("Application submission:", {
            ...formData,
            propertyId,
            unitId,
            isEntireHome,
        });

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsSubmitting(false);
        onClose();

        // Reset form
        setFormData({
            fullName: "",
            email: "",
            phone: "",
            moveInDate: "",
            employmentStatus: "",
            annualIncome: "",
            references: "",
            additionalInfo: "",
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Apply for ${propertyTitle}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="mb-4">
                    <p className="text-sm text-text-muted">
                        Complete this application form to apply for this{" "}
                        {isEntireHome ? "property" : "room"}.
                    </p>
                </div>

                {/* Personal Information */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-text">Personal Information</h4>

                    <Input
                        label="Full Name"
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        placeholder="Enter your full name"
                    />

                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="your.email@example.com"
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

                {/* Tenancy Details */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-text">Tenancy Details</h4>

                    <Input
                        label="Desired Move-in Date"
                        type="date"
                        value={formData.moveInDate}
                        onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
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
                        label="Annual Income"
                        type="text"
                        value={formData.annualIncome}
                        onChange={(e) => setFormData({ ...formData, annualIncome: e.target.value })}
                        required
                        placeholder="e.g., $50,000"
                    />
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-text">Additional Information</h4>

                    <Textarea
                        label="References"
                        value={formData.references}
                        onChange={(e) => setFormData({ ...formData, references: e.target.value })}
                        placeholder="Please provide contact details for 2 references (previous landlords, employers, etc.)"
                        rows={3}
                    />

                    <Textarea
                        label="Additional Information"
                        value={formData.additionalInfo}
                        onChange={(e) =>
                            setFormData({ ...formData, additionalInfo: e.target.value })
                        }
                        placeholder="Any additional information you'd like to share (pets, special requirements, etc.)"
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
