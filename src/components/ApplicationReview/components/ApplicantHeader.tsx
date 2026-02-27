import React from "react";
import Image from "next/image";
import { Icon } from "@/components/common";
import type { UserProfile } from "@/types/user.types";

interface ApplicantHeaderProps {
    user: UserProfile;
    propertyTypeDisplay: string;
}

export const ApplicantHeader = React.memo(({ user, propertyTypeDisplay }: ApplicantHeaderProps) => {
    return (
        <div className="bg-card rounded-[var(--radius-card-lg)] border border-border overflow-hidden shadow-[var(--shadow-card)]">
            <div className="bg-gradient-to-br from-surface-subtle to-surface-muted p-4 border-b border-border">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    {/* User Photo */}
                    <div className="flex-shrink-0">
                        {user.image_url ? (
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[var(--radius-card)] overflow-hidden border-4 border-primary-500/20 shadow-lg relative ring-2 ring-primary-500/10">
                                <Image
                                    src={user.image_url}
                                    alt={user.full_name || "Applicant"}
                                    fill
                                    sizes="(max-width: 640px) 96px, 112px"
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[var(--radius-card)] bg-surface-muted border-4 border-primary-500/20 flex items-center justify-center shadow-lg ring-2 ring-primary-500/10">
                                <Icon name="user" className="w-10 h-10 sm:w-12 sm:h-12 text-text-muted" />
                            </div>
                        )}
                    </div>

                    {/* Applicant Info */}
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                        <h3 className="text-xl sm:text-2xl font-bold text-text mb-1 truncate">
                            {user.full_name || "Applicant"}
                        </h3>
                        <p className="text-text-muted text-sm mb-3 sm:mb-4">
                            {user.occupation || "Occupation not specified"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {user.email && (
                                <ContactBadge icon="mail" value={user.email} />
                            )}
                            {user.phone && (
                                <ContactBadge icon="phone" value={user.phone} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Property Type Badge */}
            <div className="px-4 sm:px-6 py-3 bg-surface-subtle border-b border-border">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
                        Applying for
                    </span>
                    <span className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-semibold rounded-[var(--radius-tag)] capitalize">
                        {propertyTypeDisplay}
                    </span>
                </div>
            </div>
        </div>
    );
});

ApplicantHeader.displayName = "ApplicantHeader";

interface ContactBadgeProps {
    icon: "mail" | "phone";
    value: string;
}

const ContactBadge = React.memo(({ icon, value }: ContactBadgeProps) => {
    return (
        <div className="flex items-center gap-1.5 text-xs bg-card border border-border px-2.5 sm:px-3 py-1.5 rounded-[var(--radius-pill)] shadow-sm">
            <Icon name={icon} className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
            <span className="text-text truncate max-w-[200px] sm:max-w-none">{value}</span>
        </div>
    );
});

ContactBadge.displayName = "ContactBadge";
