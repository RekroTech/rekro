"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@/lib/react-query/hooks/auth/useAuth";
import * as profileHooks from "@/lib/react-query/hooks/user/useProfile";
import { Button, Input, Textarea, Select, Icon, Loader } from "@/components/common";
import { useRouter } from "next/navigation";
import type { Gender, PreferredContactMethod } from "@/types/auth.types";

export default function ProfilePage() {
    const router = useRouter();
    const { data: user, isLoading: userLoading } = useUser();
    const { mutate: updateProfile, isPending } = profileHooks.useUpdateProfile();

    const [formData, setFormData] = useState({
        full_name: "",
        username: "",
        phone: "",
        bio: "",
        occupation: "",
        date_of_birth: "",
        gender: "" as "" | Gender,
        max_budget_per_week: "",
        preferred_contact_method: "email" as PreferredContactMethod,
        notification_preferences: {
            applications: true,
            messages: true,
            property_updates: true,
            marketing: false,
        } as Record<string, boolean>,
        receive_marketing_email: false,
    });

    const [hasChanges, setHasChanges] = useState(false);
    const hydratedForUserIdRef = useRef<string | null>(null);

    // Populate form with user data (once per user id)
    useEffect(() => {
        if (!user?.id) return;
        if (hydratedForUserIdRef.current === user.id) return;

        hydratedForUserIdRef.current = user.id;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({
            full_name: user.full_name ?? "",
            username: user.username ?? "",
            phone: user.phone ?? "",
            bio: user.bio ?? "",
            occupation: user.occupation ?? "",
            date_of_birth: user.date_of_birth ?? "",
            gender: (user.gender ?? "") as "" | Gender,
            max_budget_per_week: user.max_budget_per_week?.toString() ?? "",
            preferred_contact_method: user.preferred_contact_method ?? "email",
            notification_preferences: (user.notification_preferences ?? {
                applications: true,
                messages: true,
                property_updates: true,
                marketing: false,
            }) as Record<string, boolean>,
            receive_marketing_email: user.receive_marketing_email ?? false,
        });
    }, [user]);

    const handleChange = (
        field: string,
        value: string | boolean | Record<string, unknown>
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleNotificationChange = (field: string, value: boolean) => {
        setFormData((prev) => ({
            ...prev,
            notification_preferences: {
                ...prev.notification_preferences,
                [field]: value,
            },
        }));
        setHasChanges(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const updateData = {
            full_name: formData.full_name || null,
            username: formData.username || null,
            phone: formData.phone || null,
            bio: formData.bio || null,
            occupation: formData.occupation || null,
            date_of_birth: formData.date_of_birth || null,
            gender: formData.gender || null,
            max_budget_per_week: formData.max_budget_per_week
                ? parseInt(formData.max_budget_per_week)
                : null,
            preferred_contact_method: formData.preferred_contact_method,
            notification_preferences: formData.notification_preferences,
            receive_marketing_email: formData.receive_marketing_email,
        };

        updateProfile(updateData, {
            onSuccess: () => {
                setHasChanges(false);
                alert("Profile updated successfully!");
            },
            onError: (error: Error) => {
                alert(`Failed to update profile: ${error.message}`);
            },
        });
    };

    if (userLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader />
            </div>
        );
    }

    if (!user) {
        router.push("/login");
        return null;
    }

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-text">
                                My Profile
                            </h1>
                            <p className="text-text-muted mt-1">
                                Manage your personal information and preferences
                            </p>
                        </div>
                        <div className="h-16 w-16 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-2xl">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Personal Information */}
                        <section>
                            <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
                                <Icon name="profile" className="w-5 h-5" />
                                Personal Information
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Full Name"
                                    value={formData.full_name}
                                    onChange={(e) =>
                                        handleChange("full_name", e.target.value)
                                    }
                                    placeholder="Enter your full name"
                                />
                                <Input
                                    label="Username"
                                    value={formData.username}
                                    onChange={(e) => handleChange("username", e.target.value)}
                                    placeholder="Choose a username"
                                />
                                <Input
                                    label="Email"
                                    value={user.email}
                                    disabled
                                    placeholder="Email (cannot be changed)"
                                />
                                <Input
                                    label="Phone Number"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleChange("phone", e.target.value)}
                                    placeholder="+1 234 567 8900"
                                />
                                <Input
                                    label="Date of Birth"
                                    type="date"
                                    value={formData.date_of_birth}
                                    onChange={(e) =>
                                        handleChange("date_of_birth", e.target.value)
                                    }
                                />
                                <Select
                                    label="Gender"
                                    value={formData.gender}
                                    onChange={(e) =>
                                        handleChange("gender", e.target.value as "" | Gender)
                                    }
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
                                    value={formData.occupation}
                                    onChange={(e) =>
                                        handleChange("occupation", e.target.value)
                                    }
                                    placeholder="Your occupation"
                                />
                            </div>
                            <div className="mt-4">
                                <Textarea
                                    label="Bio"
                                    value={formData.bio}
                                    onChange={(e) => handleChange("bio", e.target.value)}
                                    placeholder="Tell us a bit about yourself..."
                                    rows={4}
                                />
                            </div>
                        </section>

                        {/* Rental Preferences */}
                        {user.roles?.includes("tenant") && (
                            <section>
                                <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
                                    <Icon name="search" className="w-5 h-5" />
                                    Rental Preferences
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input
                                        label="Maximum Budget (per week)"
                                        type="number"
                                        value={formData.max_budget_per_week}
                                        onChange={(e) =>
                                            handleChange(
                                                "max_budget_per_week",
                                                e.target.value
                                            )
                                        }
                                        placeholder="e.g., 500"
                                        prefix="$"
                                    />
                                </div>
                            </section>
                        )}

                        {/* Emergency Contact section removed */}

                        {/* Contact Preferences */}
                        <section>
                            <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
                                <Icon name="settings" className="w-5 h-5" />
                                Contact & Notification Preferences
                            </h2>
                            <div className="space-y-4">
                                <Select
                                    label="Preferred Contact Method"
                                    value={formData.preferred_contact_method}
                                    onChange={(e) =>
                                        handleChange(
                                            "preferred_contact_method",
                                            e.target.value as PreferredContactMethod
                                        )
                                    }
                                    options={[
                                        { value: "email", label: "Email" },
                                        { value: "phone", label: "Phone Call" },
                                        { value: "sms", label: "SMS/Text Message" },
                                    ]}
                                />

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-text">
                                        Notification Settings
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    formData.notification_preferences
                                                        .applications
                                                }
                                                onChange={(e) =>
                                                    handleNotificationChange(
                                                        "applications",
                                                        e.target.checked
                                                    )
                                                }
                                                className="w-4 h-4 text-primary-500 rounded"
                                            />
                                            <span className="text-sm text-text">
                                                Application updates
                                            </span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    formData.notification_preferences.messages
                                                }
                                                onChange={(e) =>
                                                    handleNotificationChange(
                                                        "messages",
                                                        e.target.checked
                                                    )
                                                }
                                                className="w-4 h-4 text-primary-500 rounded"
                                            />
                                            <span className="text-sm text-text">
                                                New messages
                                            </span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    formData.notification_preferences
                                                        .property_updates
                                                }
                                                onChange={(e) =>
                                                    handleNotificationChange(
                                                        "property_updates",
                                                        e.target.checked
                                                    )
                                                }
                                                className="w-4 h-4 text-primary-500 rounded"
                                            />
                                            <span className="text-sm text-text">
                                                Property updates and availability
                                            </span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    formData.notification_preferences.marketing
                                                }
                                                onChange={(e) =>
                                                    handleNotificationChange(
                                                        "marketing",
                                                        e.target.checked
                                                    )
                                                }
                                                className="w-4 h-4 text-primary-500 rounded"
                                            />
                                            <span className="text-sm text-text">
                                                Marketing emails and promotions
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-border">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={!hasChanges || isPending}
                            >
                                {isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
