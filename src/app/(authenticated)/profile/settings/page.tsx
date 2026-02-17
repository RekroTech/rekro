"use client";

import { useState } from "react";
import { useProfile } from "@/lib/react-query/hooks/user";
import { BackButton, Button, Input, Checkbox, Loader } from "@/components/common";
import { useToast } from "@/hooks/useToast";
import { userService } from "@/services/user.service";
import type { NotificationPreferences } from "@/types/user.types";

export default function SettingsPage() {
    const { showSuccess, showError } = useToast();
    const { data: user, isLoading: userLoading } = useProfile();

    // Password change state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Privacy settings state
    const [isDiscoverable, setIsDiscoverable] = useState(user?.discoverable ?? true);
    const [shareContact, setShareContact] = useState(user?.share_contact ?? true);
    const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);

    // Notification preferences state
    const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(
        (user?.notification_preferences as NotificationPreferences) || {
            emailNotifications: true,
            smsNotifications: false,
            propertyUpdates: true,
            applicationUpdates: true,
            messageNotifications: true,
            marketingEmails: user?.receive_marketing_email ?? false,
        }
    );
    const [isSavingNotifications, setIsSavingNotifications] = useState(false);

    // Update local state when user data loads
    useState(() => {
        if (user) {
            setIsDiscoverable(user.discoverable ?? true);
            setShareContact(user.share_contact ?? true);
            const prefs = (user.notification_preferences as NotificationPreferences) || {};
            setNotificationPreferences({
                emailNotifications: prefs.emailNotifications ?? true,
                smsNotifications: prefs.smsNotifications ?? false,
                propertyUpdates: prefs.propertyUpdates ?? true,
                applicationUpdates: prefs.applicationUpdates ?? true,
                messageNotifications: prefs.messageNotifications ?? true,
                marketingEmails: user.receive_marketing_email ?? false,
            });
        }
    });

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            showError("Please fill in all password fields");
            return;
        }

        if (newPassword !== confirmPassword) {
            showError("New passwords do not match");
            return;
        }

        if (newPassword.length < 8) {
            showError("Password must be at least 8 characters long");
            return;
        }

        setIsChangingPassword(true);

        try {
            await userService.changePassword(currentPassword, newPassword);
            showSuccess("Password changed successfully");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            showError(error instanceof Error ? error.message : "Failed to change password");
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleSavePrivacySettings = async () => {
        setIsSavingPrivacy(true);

        try {
            await userService.updatePrivacySettings({
                discoverable: isDiscoverable,
                share_contact: shareContact,
            });
            showSuccess("Privacy settings updated");
        } catch (error) {
            showError(error instanceof Error ? error.message : "Failed to update privacy settings");
        } finally {
            setIsSavingPrivacy(false);
        }
    };

    const handleSaveNotificationPreferences = async () => {
        setIsSavingNotifications(true);

        try {
            await userService.updateNotificationPreferences({
                notification_preferences: notificationPreferences as Record<string, unknown>,
                receive_marketing_email: notificationPreferences.marketingEmails,
            });
            showSuccess("Notification preferences updated");
        } catch (error) {
            showError(
                error instanceof Error ? error.message : "Failed to update notification preferences"
            );
        } finally {
            setIsSavingNotifications(false);
        }
    };

    const updateNotificationPref = (key: keyof NotificationPreferences, value: boolean) => {
        setNotificationPreferences((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    if (userLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-app-bg pb-20">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6">
                    <BackButton />
                </div>

                {/* Two Column Layout */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Column - 2/3 width */}
                    <div className="flex-1 lg:w-2/3 space-y-6">
                        {/* Notification Preferences Section */}
                        <section className="bg-card rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-card)]">
                            <h2 className="text-xl font-semibold text-text mb-4">
                                Notification Preferences
                            </h2>
                            <p className="text-text-muted mb-6">
                                Choose how you want to receive updates and notifications
                            </p>
                            <div className="space-y-4">
                                <Checkbox
                                    label="Email Notifications"
                                    checked={notificationPreferences.emailNotifications}
                                    onChange={(e) =>
                                        updateNotificationPref("emailNotifications", e.target.checked)
                                    }
                                    helperText="Receive notifications via email"
                                />
                                <Checkbox
                                    label="SMS Notifications"
                                    checked={notificationPreferences.smsNotifications}
                                    onChange={(e) =>
                                        updateNotificationPref("smsNotifications", e.target.checked)
                                    }
                                    helperText="Receive notifications via SMS (if phone number is provided)"
                                />
                                <Checkbox
                                    label="Property Updates"
                                    checked={notificationPreferences.propertyUpdates}
                                    onChange={(e) =>
                                        updateNotificationPref("propertyUpdates", e.target.checked)
                                    }
                                    helperText="Get notified about properties you're interested in"
                                />
                                <Checkbox
                                    label="Application Updates"
                                    checked={notificationPreferences.applicationUpdates}
                                    onChange={(e) =>
                                        updateNotificationPref("applicationUpdates", e.target.checked)
                                    }
                                    helperText="Get notified about your application status changes"
                                />
                                <Checkbox
                                    label="Message Notifications"
                                    checked={notificationPreferences.messageNotifications}
                                    onChange={(e) =>
                                        updateNotificationPref("messageNotifications", e.target.checked)
                                    }
                                    helperText="Get notified when you receive new messages"
                                />
                                <Checkbox
                                    label="Marketing Emails"
                                    checked={notificationPreferences.marketingEmails}
                                    onChange={(e) =>
                                        updateNotificationPref("marketingEmails", e.target.checked)
                                    }
                                    helperText="Receive updates about new features and special offers"
                                />
                            </div>
                            <div className="flex justify-end mt-6">
                                <Button
                                    variant="primary"
                                    onClick={handleSaveNotificationPreferences}
                                    loading={isSavingNotifications}
                                    disabled={isSavingNotifications}
                                >
                                    Save Preferences
                                </Button>
                            </div>
                        </section>

                        {/* Privacy Settings Section */}
                        <section className="bg-card rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-card)]">
                            <h2 className="text-xl font-semibold text-text mb-4">Privacy Settings</h2>
                            <p className="text-text-muted mb-6">
                                Control how your profile appears to others
                            </p>
                            <div className="space-y-4">
                                <Checkbox
                                    label="Make Profile Discoverable"
                                    checked={isDiscoverable}
                                    onChange={(e) => setIsDiscoverable(e.target.checked)}
                                    helperText="Allow other to discover your profile when you like their properties"
                                />
                                <Checkbox
                                    label="Share Contact Information"
                                    checked={shareContact}
                                    onChange={(e) => setShareContact(e.target.checked)}
                                    helperText="Allow others to see your contact details (email and phone) when viewing your profile"
                                />
                            </div>
                            <div className="flex justify-end mt-6">
                                <Button
                                    variant="primary"
                                    onClick={handleSavePrivacySettings}
                                    loading={isSavingPrivacy}
                                    disabled={isSavingPrivacy}
                                >
                                    Save Privacy Settings
                                </Button>
                            </div>
                        </section>
                    </div>

                    {/* Right Sidebar - 1/3 width */}
                    <aside className="lg:w-1/3">
                        {/* Change Password Section */}
                        <section className="bg-card rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-card)] sticky top-8">
                            <h2 className="text-xl font-semibold text-text mb-4">Change Password</h2>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <Input
                                    type="password"
                                    label="Current Password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    autoComplete="current-password"
                                />
                                <Input
                                    type="password"
                                    label="New Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password (min 8 characters)"
                                    autoComplete="new-password"
                                />
                                <Input
                                    type="password"
                                    label="Confirm New Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    autoComplete="new-password"
                                />
                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        loading={isChangingPassword}
                                        disabled={isChangingPassword}
                                    >
                                        Change Password
                                    </Button>
                                </div>
                            </form>
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
}

