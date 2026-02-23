"use client";

import React, { useState } from "react";
import { Button } from "@/components/common";
import { Icon } from "@/components/common/Icon";
import { useUpdateProfile } from "@/lib/react-query/hooks/user/useProfile";
import { useToast } from "@/hooks/useToast";

interface DiscoverabilityPromptProps {
    onEnableDiscoverability?: () => void;
}

export const DiscoverabilityPrompt: React.FC<DiscoverabilityPromptProps> = ({
    onEnableDiscoverability,
}) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const { mutateAsync: updateProfile } = useUpdateProfile();
    const { showToast } = useToast();

    const handleEnableDiscoverability = async () => {
        try {
            setIsUpdating(true);
            await updateProfile({ discoverable: true });
            showToast("Discoverability enabled! You can now see interested users.", "success");
            onEnableDiscoverability?.();
        } catch (error) {
            console.error("Failed to enable discoverability:", error);
            showToast("Failed to enable discoverability. Please try again.", "error");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="mt-4 sm:mt-12 pt-4 sm:pt-12 border-t border-border">
            <div className="bg-surface-muted border border-border rounded-lg p-6 sm:p-8">
                <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
                    {/* Icon */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Icon name="eye-off" className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                    </div>

                    {/* Heading */}
                    <h2 className="text-xl sm:text-2xl font-bold text-text mb-3">
                        See Who's Interested
                    </h2>

                    {/* Description */}
                    <p className="text-sm sm:text-base text-text-muted mb-6 leading-relaxed">
                        Enable discoverability to see other users who have liked this property.
                        Your public profile will be visible to other users.
                    </p>

                    {/* Action Button */}
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleEnableDiscoverability}
                        disabled={isUpdating}
                        className="min-w-[200px]"
                    >
                        {isUpdating ? (
                            <>
                                <Icon name="loader" className="w-5 h-5 mr-2 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            <>
                                <Icon name="users" className="w-5 h-5 mr-2" />
                                Make me discoverable
                            </>
                        )}
                    </Button>

                    {/* Secondary Action */}
                    <p className="text-xs text-text-muted mt-4">
                        You can change this setting anytime in your{" "}
                        <a href="/profile/settings" className="text-primary hover:underline">
                            profile settings
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

