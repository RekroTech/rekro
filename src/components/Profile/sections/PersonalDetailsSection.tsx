"use client";

import { useState } from "react";
import { Image as ImageIcon, Shield } from "lucide-react";
import { Input, Select, Textarea } from "@/components/common";
import { Icon } from "@/components/common/Icon";
import type { Gender } from "@/types/db";
import type { PersonalDetailsFormState } from "../types";
import { NATIVE_LANGUAGE_OPTIONS } from "../constants";
import { PhoneVerificationModal } from "@/components/Profile";
import { normalisePhone, validateAUPhone } from "@/lib/utils";

interface PersonalDetailsSectionProps {
    userEmail: string;
    value: PersonalDetailsFormState;
    onChange: (next: PersonalDetailsFormState) => void;
    phoneVerifiedAt?: string | null;
    onPhoneVerified?: (verifiedAt: string) => void;
}

export function PersonalDetailsSection({
    userEmail,
    value,
    onChange,
    phoneVerifiedAt,
    onPhoneVerified,
}: PersonalDetailsSectionProps) {
    const [nativeLanguageOther, setNativeLanguageOther] = useState("");
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [phoneError, setPhoneError] = useState<string | null>(null);
    // Track the phone number that is actually verified on the server.
    // Initialised from the prop; kept in sync when verification succeeds.
    const [verifiedPhone, setVerifiedPhone] = useState<string | null>(
        phoneVerifiedAt ? value.phone : null
    );

    const isOtherSelected = value.native_language === "Other";
    // Phone is considered verified only when the current value matches the
    // number that was actually verified — editing away invalidates the badge.
    const isPhoneVerified = Boolean(phoneVerifiedAt) && value.phone === verifiedPhone;
    const hasPhone = value.phone.trim().length > 0;
    const isPhoneValid = hasPhone && validateAUPhone(value.phone);

    function handlePhoneChange(raw: string) {
        const next = normalisePhone(raw);
        onChange({ ...value, phone: next });
        setPhoneError(next.trim() && !validateAUPhone(next)
            ? "Enter a valid Australian number (e.g. 0412 345 678 or +61 412 345 678)"
            : null
        );
    }

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Input
                    label="Full Name"
                    value={value.full_name}
                    onChange={(e) => onChange({ ...value, full_name: e.target.value })}
                    placeholder="Enter your full name"
                />
                <Input
                    label="Username"
                    value={value.username}
                    onChange={(e) => onChange({ ...value, username: e.target.value })}
                    placeholder="Choose a username"
                />
                <Input label="Email" value={userEmail} disabled />

                {/* Phone number with verification */}
                <Input
                    label="Phone Number"
                    type="tel"
                    value={value.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="0412 345 678 or +61 412 345 678"
                    error={phoneError ?? undefined}
                    rightIcon={
                        isPhoneVerified ? (
                            <div
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-success-bg text-[11px] font-semibold whitespace-nowrap"
                                style={{ color: "var(--primary-600)" }}
                                title={`Verified on ${new Date(phoneVerifiedAt!).toLocaleDateString()}`}
                            >
                                <Icon icon={Shield} size={14} />
                                Verified
                            </div>
                        ) : (
                            <button
                                type="button"
                                disabled={!isPhoneValid}
                                onClick={() => setShowVerifyModal(true)}
                                className="text-primary-500 text-xs font-medium whitespace-nowrap px-2 py-0.5 rounded-md transition-all duration-150 hover:scale-105 hover:text-primary-400 hover:bg-primary-500/10 active:scale-95 active:bg-primary-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-transparent"
                                title={
                                    !hasPhone
                                        ? "Enter a phone number first"
                                        : phoneError
                                          ? phoneError
                                          : "Verify your phone number"
                                }
                            >
                                Verify
                            </button>
                        )
                    }
                />

                <Input
                    label="Date of Birth"
                    type="date"
                    value={value.date_of_birth}
                    onChange={(e) => onChange({ ...value, date_of_birth: e.target.value })}
                />
                <Select
                    label="Gender"
                    value={value.gender}
                    onChange={(e) => onChange({ ...value, gender: e.target.value as "" | Gender })}
                    options={[
                        { value: "", label: "Select gender" },
                        { value: "male", label: "Male" },
                        { value: "female", label: "Female" },
                        { value: "non_binary", label: "Non-binary" },
                        { value: "prefer_not_to_say", label: "Prefer not to say" },
                    ]}
                />
                <Input
                    label="Occupation"
                    value={value.occupation}
                    onChange={(e) => onChange({ ...value, occupation: e.target.value })}
                    placeholder="Your occupation"
                />

                <Select
                    label="Native Language"
                    value={isOtherSelected ? "Other" : value.native_language}
                    onChange={(e) => {
                        const next = e.target.value;
                        if (next === "Other") {
                            onChange({ ...value, native_language: "Other" });
                        } else {
                            setNativeLanguageOther("");
                            onChange({ ...value, native_language: next });
                        }
                    }}
                    options={NATIVE_LANGUAGE_OPTIONS}
                />

                {isOtherSelected && (
                    <Input
                        label="Specify Native Language"
                        value={nativeLanguageOther}
                        onChange={(e) => {
                            const next = e.target.value;
                            setNativeLanguageOther(next);
                            onChange({ ...value, native_language: next.trim() ? next : "Other" });
                        }}
                        placeholder="e.g., Swahili"
                    />
                )}
            </div>

            <Textarea
                label="Bio"
                value={value.bio}
                onChange={(e) => onChange({ ...value, bio: e.target.value })}
                placeholder="Tell us a bit about yourself..."
                rows={4}
            />

            {/* Hints notification box */}
            {(!value.image_url || !isPhoneVerified) && (
                <div className="mt-2 flex flex-col gap-1.5 px-3 py-2.5 rounded-lg border border-warning-200 bg-warning-50 dark:border-warning-500/20 dark:bg-warning-500/5">
                    {!value.image_url && (
                        <div className="flex items-start gap-2 text-sm">
                            <Icon icon={ImageIcon} size={16} className="mt-0.5 shrink-0 text-warning-600 dark:text-warning-200" />
                            <span>
                                <span className="font-medium text-warning-800 dark:text-warning-100">Add a profile photo.</span>
                                <span className="ml-1 text-text-muted">Click on the avatar to upload.</span>
                            </span>
                        </div>
                    )}
                    {!isPhoneVerified && (
                        <div className="flex items-start gap-2 text-sm">
                            <Icon icon={Shield} size={16} className="mt-0.5 shrink-0 text-warning-600 dark:text-warning-200" />
                            <span>
                                <span className="font-medium text-warning-800 dark:text-warning-100">Verify your phone number.</span>
                                <span className="ml-1 text-text-muted">Click Verify inside the phone field above.</span>
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Phone OTP Verification Modal */}
            <PhoneVerificationModal
                isOpen={showVerifyModal}
                phone={value.phone}
                onClose={() => setShowVerifyModal(false)}
                onVerified={(verifiedAt) => {
                    setShowVerifyModal(false);
                    setVerifiedPhone(value.phone); // lock the badge to this number
                    onPhoneVerified?.(verifiedAt);
                }}
            />
        </div>
    );
}
