"use client";

import { useRouter } from "next/navigation";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Icon } from "./Icon";

interface ProfileCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    nextUrl?: string;
}

export function ProfileCompletionModal({
    isOpen,
    onClose,
    nextUrl,
}: ProfileCompletionModalProps) {
    const router = useRouter();

    const handleContinueToProfile = () => {
        const profileUrl = nextUrl
            ? `/profile?toast=complete-profile&next=${encodeURIComponent(nextUrl)}`
            : "/profile?toast=complete-profile";

        router.push(profileUrl);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Complete Your Profile" size="sm">
            <div className="space-y-6">
                {/* Icon and Message */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center">
                        <Icon name="user" className="w-8 h-8 text-primary-600" />
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-text mb-2">
                            Profile Completion Required
                        </h4>
                        <p className="text-text-muted text-sm">
                            Complete your profile once and unlock the ability to apply to any property instantly.
                            Your verified profile increases trust with landlords and speeds up approvals.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 mb-2">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="w-full sm:w-1/2"
                    >
                        Maybe Later
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleContinueToProfile}
                        className="w-full sm:w-1/2"
                    >
                        Complete Profile
                        <Icon name="chevron-right" className="w-5 h-5 ml-2" />
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

