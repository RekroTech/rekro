"use client";

import React, { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import { Button } from "@/components/common/Button";

interface EnquiryModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyTitle: string;
    propertyId: string;
    unitId?: string;
    isEntireHome: boolean;
}

interface FormData {
    name: string;
    email: string;
    phone: string;
    message: string;
}

interface FormErrors {
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
}

export function EnquiryModal({
    isOpen,
    onClose,
    propertyTitle,
    propertyId,
    unitId,
    isEntireHome,
}: EnquiryModalProps) {
    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        phone: "",
        message: "",
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }

        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required";
        }

        if (!formData.message.trim()) {
            newErrors.message = "Message is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus("idle");

        try {
            const response = await fetch("/api/enquiry", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    propertyTitle,
                    propertyId,
                    unitId,
                    isEntireHome,
                }),
            });

            if (!response.ok) {
                setSubmitStatus("error");
                return;
            }

            setSubmitStatus("success");

            // Reset form after successful submission
            setTimeout(() => {
                setFormData({ name: "", email: "", phone: "", message: "" });
                setSubmitStatus("idle");
                onClose();
            }, 2000);
        } catch (error) {
            console.error("Error sending enquiry:", error);
            setSubmitStatus("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setFormData({ name: "", email: "", phone: "", message: "" });
            setErrors({});
            setSubmitStatus("idle");
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Enquire About This Property" size="lg">
            {submitStatus === "success" ? (
                <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                        <svg
                            className="w-8 h-8 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Enquiry Sent Successfully!
                    </h3>
                    <p className="text-gray-600">
                        Thank you for your interest. We&apos;ll get back to you shortly.
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Property Information Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 mb-4">
                        {/* Info Message */}
                        <div className="">
                            <p className="text-xs text-gray-600 flex items-start gap-2">
                                <svg
                                    className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span>
                                    Fill out the form below and we&apos;ll get back to you within 24
                                    hours to discuss your enquiry.
                                </span>
                            </p>
                        </div>
                    </div>

                    <Input
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        error={errors.name}
                        placeholder="Enter your full name"
                        disabled={isSubmitting}
                        required
                    />

                    <Input
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                        placeholder="your.email@example.com"
                        disabled={isSubmitting}
                        required
                    />

                    <Input
                        label="Phone Number"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        error={errors.phone}
                        placeholder="+1 (555) 000-0000"
                        disabled={isSubmitting}
                        required
                    />

                    <Textarea
                        label="Message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        error={errors.message}
                        placeholder="Tell us about your requirements, preferred move-in date, or any questions you have..."
                        rows={5}
                        disabled={isSubmitting}
                        required
                    />

                    {submitStatus === "error" && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            <p className="text-sm">
                                Failed to send enquiry. Please try again or contact us directly.
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            {isSubmitting ? "Sending..." : "Send Enquiry"}
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
