import React from "react";
import { Icon } from "@/components/common";
import type { UserProfile } from "@/types/user.types";

interface ProfileCompletenessNoticeProps {
    user: UserProfile;
}

export const ProfileCompletenessNotice = React.memo(({ user }: ProfileCompletenessNoticeProps) => {
    const isIncomplete = !user.user_application_profile || !user.phone || !user.date_of_birth;

    if (!isIncomplete) {
        return null;
    }

    return (
        <div className="bg-warning-500/10 border border-warning-500/20 rounded-[var(--radius-card)] p-4">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-warning-500/20 flex items-center justify-center">
                    <Icon name="alert-circle" className="w-4 h-4 text-warning-600" />
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-warning-800 text-sm mb-1">
                        Incomplete Profile
                    </p>
                    <p className="text-warning-700 text-xs leading-relaxed">
                        Some information is missing from your profile. Completing your
                        profile increases your chances of approval.
                    </p>
                </div>
            </div>
        </div>
    );
});

ProfileCompletenessNotice.displayName = "ProfileCompletenessNotice";

