"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/common";
import type { ShareableProfile } from "@/types/user.types";

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
 * Format visa status for display
 */
function formatVisaStatus(visaStatus: string | null): string | null {
    if (!visaStatus) return null;
    return visaStatus
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

/**
 * Shareable profile card showing user's key information
 * Can be shared with landlords when applying for properties
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

    const completionColor =
        profile.completionPercentage >= 75
            ? "text-primary-700 dark:text-primary-300"
            : profile.completionPercentage >= 50
              ? "text-warning-700 dark:text-warning-300"
              : "text-danger-600 dark:text-danger-400";

    const completionBgColor =
        profile.completionPercentage >= 75
            ? "bg-primary-100 dark:bg-primary-800"
            : profile.completionPercentage >= 50
              ? "bg-warning-50 dark:bg-warning-700"
              : "bg-danger-500/15 dark:bg-danger-700";

    const completionBarColor =
        profile.completionPercentage >= 75
            ? "bg-primary-600 dark:bg-primary-500"
            : profile.completionPercentage >= 50
              ? "bg-warning-600 dark:bg-warning-500"
              : "bg-danger-600 dark:bg-danger-500";

    const age = profile.age || (profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null);
    const formattedVisaStatus = formatVisaStatus(profile.visaStatus);

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
                <div className="flex items-start gap-4">
                    <div className="relative">
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
                            className={`relative ${editable ? "cursor-pointer group" : ""}`}
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
                                    <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-muted border border-border">
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
                                <div className="w-20 h-20 rounded-full bg-surface-muted flex items-center justify-center border border-border relative">
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

                            {/* Completion badge */}
                            <div
                                className={`absolute -bottom-1 -right-1 ${completionBgColor} ${completionColor} rounded-full px-2 py-1 text-xs font-bold shadow-[var(--shadow-soft)] border border-border`}
                            >
                                {profile.completionPercentage}%
                            </div>
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

                {/* Application Status */}
                {(formattedVisaStatus || profile.employmentStatus || profile.studentStatus) && (
                    <div className="p-3 bg-panel rounded-lg space-y-2 border border-border">
                        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                            Status
                        </h3>
                        {formattedVisaStatus && (
                            <div className="flex items-center gap-2">
                                <Icon name="map-pin" className="w-4 h-4 text-secondary-500 dark:text-secondary-400" />
                                <span className="text-sm text-text font-medium">
                                    {formattedVisaStatus}
                                </span>
                            </div>
                        )}
                        {profile.employmentStatus === "working" && (
                            <div className="flex items-center gap-2">
                                <Icon name="dollar" className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                <span className="text-sm text-text font-medium">Employed</span>
                            </div>
                        )}
                        {profile.studentStatus === "student" && (
                            <div className="flex items-center gap-2">
                                <Icon name="book" className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                <span className="text-sm text-text font-medium">Student</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Rental Preferences */}
                <div className="bg-panel rounded-lg p-4 space-y-3 border border-border">
                    <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                        Rental Preferences
                    </h3>

                    {profile.currentLocation && (
                        <div className="flex items-start gap-2">
                            <Icon
                                name="map"
                                className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0"
                            />
                            <div className="flex-1">
                                <p className="text-xs text-text-subtle">Current location</p>
                                <p className="text-sm font-medium text-text">
                                    {profile.currentLocation}
                                </p>
                            </div>
                        </div>
                    )}

                    {profile.preferredLocality && (
                        <div className="flex items-start gap-2">
                            <Icon
                                name="navigation"
                                className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0"
                            />
                            <div className="flex-1">
                                <p className="text-xs text-text-subtle">Preferred locality</p>
                                <p className="text-sm font-medium text-text">
                                    {profile.preferredLocality}
                                </p>
                            </div>
                        </div>
                    )}

                    {profile.budget && (
                        <div className="flex items-start gap-2">
                            <Icon
                                name="dollar"
                                className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0"
                            />
                            <div className="flex-1">
                                <p className="text-xs text-text-subtle">Max budget</p>
                                <p className="text-sm font-medium text-text">
                                    ${profile.budget}/week
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Lifestyle Preferences */}
                {(profile.hasPets !== null || profile.smoker !== null) && (
                    <div className="flex flex-wrap gap-2">
                        {profile.hasPets !== null && (
                            <div
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border ${
                                    profile.hasPets
                                        ? "bg-warning-500/15 dark:bg-warning-500/25 text-text"
                                        : "bg-surface-muted dark:bg-surface text-text"
                                }`}
                            >
                                <Icon name={profile.hasPets ? "check" : "x"} className="w-3 h-3" />
                                <span>{profile.hasPets ? "Has pets" : "No pets"}</span>
                            </div>
                        )}
                        {profile.smoker !== null && (
                            <div
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border ${
                                    profile.smoker
                                        ? "bg-danger-500/15 dark:bg-danger-500/25 text-text"
                                        : "bg-primary-100 dark:bg-primary-900/40 text-text"
                                }`}
                            >
                                <Icon
                                    name={profile.smoker ? "alert-circle" : "check-circle"}
                                    className="w-3 h-3"
                                />
                                <span>{profile.smoker ? "Smoker" : "Non-smoker"}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Profile Completion */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-muted">
                            Profile Completion
                        </span>
                        <span className={`text-sm font-bold ${completionColor}`}>
                            {profile.completionPercentage}%
                        </span>
                    </div>
                    <div className="w-full bg-primary-100/60 dark:bg-primary-900/30 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${completionBarColor}`}
                            style={{ width: `${profile.completionPercentage}%` }}
                        />
                    </div>
                    {profile.completionPercentage < 100 && (
                        <p className="text-xs text-text-subtle mt-2">
                            Finish your profile to apply faster and get better matches.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
