"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/common";
import type { ShareableProfile } from "@/types/user.types";
import { useProfileCompletion } from "@/contexts/ProfileCompletionContext";

interface ProfileCardProps {
    profile: ShareableProfile;
    showShareButton?: boolean;
    onShare?: () => void;
    editable?: boolean;
    onImageUpdate?: (file: File) => void;
    isUploadingImage?: boolean;
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: string | null): number | null {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

/**
 * Shareable profile card showing user's key information
 */
export function ProfileCard({
    profile,
    showShareButton = false,
    onShare,
    editable = false,
    onImageUpdate,
    isUploadingImage = false,
}: ProfileCardProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [errorImageUrl, setErrorImageUrl] = useState<string | null | undefined>(null);

    // Get unlocked badges from context
    const { completion } = useProfileCompletion();
    const unlockedBadges = completion?.unlockedBadges || [];
    const badgeCount = unlockedBadges.length;

    const badgeBorderColor =
        badgeCount === 1
            ? "border-amber-700 dark:border-amber-400"
            : badgeCount === 2
              ? "border-slate-400 dark:border-slate-300"
              : badgeCount === 3
                ? "border-yellow-500 dark:border-yellow-400"
                : "border-border";


    const completionColor =
        profile.completionPercentage >= 75
            ? "text-primary-700 dark:text-primary-300"
            : profile.completionPercentage >= 50
              ? "text-warning-700 dark:text-warning-300"
              : "text-danger-600 dark:text-danger-400";


    const completionBarColor =
        profile.completionPercentage >= 75
            ? "bg-primary-600 dark:bg-primary-500"
            : profile.completionPercentage >= 50
              ? "bg-warning-600 dark:bg-warning-500"
              : "bg-danger-600 dark:bg-danger-500";

    const age = profile.age || (profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null);

    const handleImageClick = () => {
        if (editable && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && onImageUpdate) {
            // Validate file type
            if (!file.type.startsWith("image/")) {
                alert("Please select an image file");
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert("Image size should be less than 5MB");
                return;
            }
            setErrorImageUrl(null); // Reset error state when uploading new image
            onImageUpdate(file);
        }
        // Reset input so the same file can be selected again
        event.target.value = "";
    };

    // Reset image error when imageUrl changes
    const currentImageUrl = profile.imageUrl;
    const hasValidImage = currentImageUrl && errorImageUrl !== currentImageUrl;

    return (
        <div className="card border border-border p-4 sm:p-6 max-w-md relative text-text">
            {/* Share button (top right) */}
            {showShareButton && (
                <button
                    onClick={onShare}
                    className="absolute top-4 right-4 p-2 hover:bg-surface-muted rounded-lg transition-colors focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--focus-ring)]"
                    aria-label="Share profile"
                >
                    <Icon name="share" className="w-5 h-5 text-text-muted" />
                </button>
            )}

            <div className="space-y-4">
                {/* Profile Picture & Basic Info */}
                <div className="flex items-start gap-3 sm:gap-4">
                    <div className="relative flex-shrink-0">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={!editable || isUploadingImage}
                        />

                        <div
                            onClick={handleImageClick}
                            className={`relative z-10 ${editable ? "cursor-pointer group" : ""}`}
                            role={editable ? "button" : undefined}
                            aria-label={editable ? "Click to update profile image" : undefined}
                            tabIndex={editable ? 0 : undefined}
                            onKeyDown={
                                editable
                                    ? (e) => {
                                          if (e.key === "Enter" || e.key === " ") {
                                              e.preventDefault();
                                              handleImageClick();
                                          }
                                      }
                                    : undefined
                            }
                        >
                            {hasValidImage ? (
                                <>
                                    <div className={`w-20 h-20 rounded-full overflow-hidden bg-surface-muted border-2 ${badgeBorderColor}`}>
                                        <Image
                                            src={currentImageUrl!}
                                            alt={profile.fullName}
                                            width={80}
                                            height={80}
                                            className="w-full h-full object-cover"
                                            unoptimized
                                            onError={() => {
                                                console.error(
                                                    "Failed to load profile image:",
                                                    currentImageUrl
                                                );
                                                setErrorImageUrl(currentImageUrl);
                                            }}
                                        />
                                    </div>
                                    {editable && (
                                        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            {isUploadingImage ? (
                                                <Icon
                                                    name="loader"
                                                    className="w-6 h-6 text-white animate-spin"
                                                />
                                            ) : (
                                                <Icon name="image" className="w-6 h-6 text-white" />
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className={`w-20 h-20 rounded-full bg-surface-muted flex items-center justify-center border-2 ${badgeBorderColor} relative`}>
                                    <Icon name="profile" className="w-10 h-10 text-text-muted" />
                                    {editable && (
                                        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            {isUploadingImage ? (
                                                <Icon
                                                    name="loader"
                                                    className="w-6 h-6 text-white animate-spin"
                                                />
                                            ) : (
                                                <Icon name="image" className="w-6 h-6 text-white" />
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold text-text">{profile.fullName}</h2>
                        {profile.username && (
                            <p className="text-sm text-text-muted">@{profile.username}</p>
                        )}
                        {profile.occupation && (
                            <p className="text-sm text-text font-medium mt-1">
                                {profile.occupation}
                            </p>
                        )}
                    </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                    <div className="p-3 bg-surface-subtle rounded-lg border border-border">
                        <p className="text-sm text-text-muted italic">&#34;{profile.bio}&#34;</p>
                    </div>
                )}

                {/* Contact Information */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Icon name="mail" className="w-4 h-4 text-text-muted" />
                        <p className="text-sm text-text">{profile.email}</p>
                    </div>
                    {profile.phone && (
                        <div className="flex items-center gap-2">
                            <Icon name="info" className="w-4 h-4 text-text-muted" />
                            <p className="text-sm text-text">{profile.phone}</p>
                        </div>
                    )}
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                    {profile.nativeLanguage && (
                        <span className="px-3 py-1 bg-secondary-500 dark:bg-secondary-600 text-white text-xs font-medium rounded-full">
                            {profile.nativeLanguage}
                        </span>
                    )}
                    {age && (
                        <span className="px-3 py-1 bg-surface-muted text-text text-xs font-medium rounded-full border border-border">
                            {age} years old
                        </span>
                    )}
                    {profile.gender && (
                        <span className="px-3 py-1 bg-surface-muted text-text text-xs font-medium rounded-full capitalize border border-border">
                            {profile.gender.replace(/_/g, " ")}
                        </span>
                    )}
                </div>

                {/* Rent Pass - Profile Completion */}
                <div className="pt-3 border-t border-border">
                    <div className="flex items-center gap-4">
                        {/* Circular Progress Indicator */}
                        <div className="relative flex-shrink-0">
                            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                                {/* Background circle */}
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="34"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    className="text-primary-100/60 dark:text-primary-900/30"
                                />
                                {/* Progress circle */}
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="34"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    className={completionBarColor.replace("bg-", "text-")}
                                    strokeDasharray={`${2 * Math.PI * 34}`}
                                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - profile.completionPercentage / 100)}`}
                                    style={{ transition: "stroke-dashoffset 0.3s ease" }}
                                />
                            </svg>
                            {/* Percentage in center */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-xl font-bold ${completionColor}`}>
                                    {profile.completionPercentage}%
                                </span>
                            </div>
                        </div>

                        {/* Rent Pass Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base font-bold text-primary-600 dark:text-primary-400">RENT PASS</h3>
                                {profile.completionPercentage === 100 && (
                                    <Icon
                                        name="check-circle"
                                        className="w-4 h-4 text-primary-600 dark:text-primary-400"
                                    />
                                )}
                            </div>
                            {profile.completionPercentage < 100 ? (
                                <p className="text-xs text-text-muted">
                                    Finish your profile to apply faster and get better matches.
                                </p>
                            ) : (
                                <p className="text-xs font-medium text-text-muted">
                                    Ready to apply for properties!
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
