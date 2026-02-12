"use client";

import { Dropdown, Icon } from "@/components/common";
import { useShareProperty } from "../hooks";

interface ShareDropdownProps {
    propertyTitle: string;
    unitId: string;
    propertyId: string;
}

export function ShareDropdown({ propertyTitle, unitId, propertyId }: ShareDropdownProps) {
    const { copied, handleCopyLink, handleSocialShare } = useShareProperty({
        propertyId,
        unitId,
        propertyTitle,
    });

    return (
        <Dropdown
            align="right"
            trigger={
                <div className="p-2 rounded-full bg-surface-muted text-foreground hover:bg-surface-muted hover:text-primary-600 transition-all">
                    <Icon name="share" className="w-5 h-5" />
                </div>
            }
            items={[
                {
                    label: copied ? "Link copied!" : "Copy link",
                    onClick: handleCopyLink,
                    icon: copied ? (
                        <Icon name="check-circle" className="w-4 h-4 text-green-600" />
                    ) : (
                        <Icon name="copy" className="w-4 h-4" />
                    ),
                },
                {
                    label: "Email",
                    onClick: () => handleSocialShare("email"),
                    icon: <Icon name="mail" className="w-4 h-4" />,
                },
                {
                    label: "WhatsApp",
                    onClick: () => handleSocialShare("whatsapp"),
                    icon: <Icon name="whatsapp" className="w-4 h-4 text-green-500" />,
                },
                {
                    label: "Facebook",
                    onClick: () => handleSocialShare("facebook"),
                    icon: <Icon name="facebook" className="w-4 h-4 text-blue-600" />,
                },
                {
                    label: "Twitter",
                    onClick: () => handleSocialShare("twitter"),
                    icon: <Icon name="twitter" className="w-4 h-4 text-sky-500" />,
                },
            ]}
        />
    );
}
