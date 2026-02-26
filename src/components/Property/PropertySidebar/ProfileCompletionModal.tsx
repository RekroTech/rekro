"use client";

import { useRouter } from "next/navigation";
import { Modal, Button, Icon } from "@/components/common";

interface ProfileCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProfileCompletionModal({
    isOpen,
    onClose,
}: ProfileCompletionModalProps) {
    const router = useRouter();

    const handleContinueToProfile = () => {
        router.push("/profile");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <div className="mt-2">
                {/* Icon and Message */}
                <div className="flex flex-col items-center text-center mb-6 sm:mb-8 gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center">
                        <Icon name="user" className="w-8 h-8 text-primary-600" />
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-text mb-2">
                            Profile Completion Required
                        </h4>
                        <p className="text-text-muted text-sm">
                            Complete your profile once and unlock the ability to apply to any property instantly.
                            Your verified profile increases trust and speeds up approvals.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 mb-0 sm:my-2">
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

