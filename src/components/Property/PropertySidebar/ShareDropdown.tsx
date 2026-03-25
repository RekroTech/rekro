"use client";

import { Dropdown, Icon, WhatsAppIcon, FacebookIcon, XIcon } from "@/components/common";
import { Share2, CheckCircle2, Copy, Mail } from "lucide-react";
import { useShareProperty } from "../hooks";

interface ShareDropdownProps {
    propertyAddress: string;
    unitId: string;
    propertyId: string;
}

export function ShareDropdown({ propertyAddress, unitId, propertyId }: ShareDropdownProps) {
    const { copied, handleCopyLink, handleSocialShare } = useShareProperty({
        propertyId,
        unitId,
        propertyAddress,
    });

    return (
        <Dropdown
            align="right"
            trigger={
                <div className="p-2 rounded-full bg-surface-muted text-text-muted hover:bg-surface-subtle hover:text-primary-600 transition-all touch-manipulation active:scale-95">
                    <Icon icon={Share2} size={20} />
                </div>
            }
            items={[
                {
                    label: copied ? "Link copied!" : "Copy link",
                    onClick: handleCopyLink,
                    icon: copied ? (
                        <Icon icon={CheckCircle2} size={16} className="text-green-600" />
                    ) : (
                        <Icon icon={Copy} size={16} />
                    ),
                },
                {
                    label: "Email",
                    onClick: () => handleSocialShare("email"),
                    icon: <Icon icon={Mail} size={16} />,
                },
                {
                    label: "WhatsApp",
                    onClick: () => handleSocialShare("whatsapp"),
                    icon: <Icon icon={WhatsAppIcon} size={16} className="text-green-500" />,
                },
                {
                    label: "Facebook",
                    onClick: () => handleSocialShare("facebook"),
                    icon: <Icon icon={FacebookIcon} size={16} className="text-blue-600" />,
                },
                {
                    label: "Twitter / X",
                    onClick: () => handleSocialShare("twitter"),
                    icon: <Icon icon={XIcon} size={16} className="text-sky-500" />,
                },
            ]}
        />
    );
}
