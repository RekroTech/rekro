"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common";
import { useProfile } from "@/lib/hooks/user";

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

export function EnquiryForm({
    isOpen,
    onClose,
    propertyTitle,
    propertyId,
    unitId,
    isEntireHome,
}: EnquiryModalProps) {
    const { data: user } = useProfile();
    const isLoggedIn = !!user;

    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        phone: "",
        message: "",
    });

    // Pre-fill name and email from user data if logged in
    useEffect(() => {
        if (isLoggedIn && user) {
            setFormData((prev) => ({
                ...prev,
                name: user.full_name || "",
                email: user.email || "",
                phone: user.phone || "",
            }));
        }
    }, [isLoggedIn, user]);

    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // Only validate name and email if user is not logged in
        if (!isLoggedIn) {
            if (!formData.name.trim()) {
                newErrors.name = "Name is required";
            }

            if (!formData.email.trim()) {
                newErrors.email = "Email is required";
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                newErrors.email = "Invalid email format";
            }
        }

        // Validate phone only if not already available from user data
        if (!isLoggedIn || !user?.phone) {
            if (!formData.phone.trim()) {
                newErrors.phone = "Phone number is required";
            }
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
            // Only include name and email in body if user is not logged in
            // Only include phone if user doesn't have it or provided a new one
            const bodyData = isLoggedIn
                ? {
                      ...(user?.phone ? {} : { phone: formData.phone }),
                      message: formData.message,
                      propertyTitle,
                      propertyId,
                      unitId,
                      isEntireHome,
                  }
                : {
                      ...formData,
                      propertyTitle,
                      propertyId,
                      unitId,
                      isEntireHome,
                  };

            const response = await fetch("/api/enquiry", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(bodyData),
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
                        <Icon name="check" className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Enquiry Sent Successfully!
                    </h3>
                    <p className="text-gray-600">
                        Thank you for your interest. We&apos;ll get back to you shortly.
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="">
                    {/* Property Information Card */}
                    <div className="bg-panel border border-border rounded-xl p-5 mb-4">
                        {/* Info Message */}
                        <div className="">
                            <p className="text-xs sm:text-sm text-text-muted flex items-start gap-2">
                                <Icon
                                    name="info"
                                    className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5"
                                />
                                <span>
                                    Fill out the form below and we&apos;ll get back to you within 24
                                    hours to discuss your enquiry.
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Only show name and email fields if user is not logged in */}
                    {!isLoggedIn && (
                        <>
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
                        </>
                    )}

                    {/* Only show phone field if user is not logged in OR logged in but has no phone */}
                    {(!isLoggedIn || !user?.phone) && (
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
                    )}

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

                    <div className="flex gap-3 mt-3">
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
