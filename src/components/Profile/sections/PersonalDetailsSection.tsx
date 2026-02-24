"use client";

import { useState } from "react";
import { Input, Select, Textarea } from "@/components/common";
import type { Gender } from "@/types/db";
import type { PersonalDetailsFormState } from "../types";
import { NATIVE_LANGUAGE_OPTIONS } from "../constants";

interface PersonalDetailsSectionProps {
    userEmail: string;
    value: PersonalDetailsFormState;
    onChange: (next: PersonalDetailsFormState) => void;
}

export function PersonalDetailsSection({
    userEmail,
    value,
    onChange,
}: PersonalDetailsSectionProps) {
    const [nativeLanguageOther, setNativeLanguageOther] = useState("");

    const isOtherSelected = value.native_language === "Other";

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Input
                    label="Phone Number"
                    type="tel"
                    value={value.phone}
                    onChange={(e) => onChange({ ...value, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
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
        </div>
    );
}
