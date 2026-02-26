"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/common";
import { Icon } from "@/components/common/Icon";
import { useUpdateProfile } from "@/lib/hooks/user";
import { useToast } from "@/hooks/useToast";

interface DiscoverabilityPromptProps {
    onEnableDiscoverability?: () => void;
}

// Preview users for the blurred background
const PREVIEW_USERS = [
    { id: 1, name: "Sarah J.", image: "https://i.pravatar.cc/150?img=1" },
    { id: 2, name: "Michael C.", image: "https://i.pravatar.cc/150?img=12" },
    { id: 3, name: "Emma W.", image: "https://i.pravatar.cc/150?img=5" },
    { id: 4, name: "Priya P.", image: "https://i.pravatar.cc/150?img=9" },
    { id: 5, name: "Alex M.", image: "https://i.pravatar.cc/150?img=13" },
    { id: 6, name: "Olivia M.", image: "https://i.pravatar.cc/150?img=10" },
];

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
        <div className="my-4 sm:my-12">
            <div className="relative border border-border rounded-lg overflow-hidden">
                {/* Blurred Background Preview */}
                <div className="absolute inset-0 py-8 overflow-hidden">
                    <div className="mb-4 sm:mb-6 px-2 sm:px-0">
                        <h6 className="text-xl sm:text-2xl font-bold text-text">
                            People Interested in This Property
                        </h6>
                    </div>
                    <div className="flex gap-6 justify-center items-start">
                        {PREVIEW_USERS.map((user) => (
                            <div
                                key={user.id}
                                className="card border border-border p-4 flex-shrink-0 w-48 text-text flex flex-col blur-[2px] opacity-40"
                            >
                                <div className="text-center">
                                    <div className="relative mx-auto mb-3">
                                        <div className="w-32 h-32 rounded-full overflow-hidden bg-surface-muted border-2 border-border mx-auto">
                                            <Image
                                                src={user.image}
                                                alt={user.name}
                                                width={128}
                                                height={128}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>

                                    <h3 className="text-base font-bold text-text truncate">
                                        {user.name}
                                    </h3>

                                    <p className="text-xs text-text-muted truncate">
                                        Interested User
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 p-4 sm:p-6 bg-surface/20 backdrop-blur-md">
                    <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
                        {/* Icon */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Icon name="eye-off" className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                        </div>

                        {/* Heading */}
                        <h2 className="text-xl sm:text-2xl font-bold text-text mb-3">
                            See Who&#39;s Interested
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
        </div>
    );
};

