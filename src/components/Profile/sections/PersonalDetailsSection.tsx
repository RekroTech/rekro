"use client";

import { useState } from "react";
import { Input, Select, Textarea } from "@/components/common";
import { Icon } from "@/components/common/Icon";
import type { Gender } from "@/types/db";
import type { PersonalDetailsFormState } from "../types";
import { NATIVE_LANGUAGE_OPTIONS } from "../constants";
import { PhoneVerificationModal } from "@/components/Profile";

interface PersonalDetailsSectionProps {
    userEmail: string;
    value: PersonalDetailsFormState;
    onChange: (next: PersonalDetailsFormState) => void;
    /** ISO timestamp set once the phone has been verified */
    phoneVerifiedAt?: string | null;
    /** Called after successful OTP verification so parent can refresh the profile */
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

    const isOtherSelected = value.native_language === "Other";
    const isPhoneVerified = Boolean(phoneVerifiedAt);
    const hasPhone = value.phone.trim().length > 0;

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
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">
                        Phone Number
                    </label>
                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <Input
                                type="tel"
                                value={value.phone}
                                onChange={(e) => onChange({ ...value, phone: e.target.value })}
                                placeholder="+61 4XX XXX XXX"
                            />
                        </div>
                        {isPhoneVerified ? (
                            <div
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-success-500/10 border border-success-500/30 text-success-600 dark:text-success-400 text-xs font-semibold whitespace-nowrap"
                                title={`Verified on ${new Date(phoneVerifiedAt!).toLocaleDateString()}`}
                            >
                                <Icon name="check-circle" className="w-4 h-4" />
                                Verified
                            </div>
                        ) : (
                            <button
                                type="button"
                                disabled={!hasPhone}
                                onClick={() => setShowVerifyModal(true)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-xs font-semibold whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                title={
                                    hasPhone
                                        ? "Verify your phone number"
                                        : "Enter a phone number first"
                                }
                            >
                                <Icon name="shield" className="w-4 h-4" />
                                Verify
                            </button>
                        )}
                    </div>
                    {!isPhoneVerified && hasPhone && (
                        <p className="text-xs text-text-subtle">
                            Verify your number to unlock benefits like SMS notifications.
                        </p>
                    )}
                </div>

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

            {/* Profile image prompt */}
            {!value.image_url && (
                <p className="mt-2 text-sm text-right">
                    <span className="text-warning-800 dark:text-warning-100">
                        Add a profile photo.
                    </span>
                    <span className="ml-1 text-text-muted">(Click on the avatar to upload.)</span>
                </p>
            )}

            {/* Phone OTP Verification Modal */}
            <PhoneVerificationModal
                isOpen={showVerifyModal}
                phone={value.phone}
                onClose={() => setShowVerifyModal(false)}
                onVerified={(verifiedAt) => {
                    setShowVerifyModal(false);
                    onPhoneVerified?.(verifiedAt);
                }}
            />
        </div>
    );
}
