import { useState } from "react";
import { useCreateUnitShare } from "@/lib/hooks/units";
import { useSessionUser } from "@/lib/hooks/auth";

interface UseSharePropertyProps {
    propertyId: string;
    unitId: string;
    propertyTitle: string;
}

export function useShareProperty({ propertyId, unitId, propertyTitle }: UseSharePropertyProps) {
    const [copied, setCopied] = useState(false);
    const { data: sessionUser } = useSessionUser();
    const createShare = useCreateUnitShare();

    const propertyUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/property/${propertyId}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(propertyUrl);
            setCopied(true);

            await createShare.mutateAsync({
                shared_by: sessionUser?.id ?? null,
                unit_id: unitId,
                channel: "link",
                to_value: null,
            });

            setTimeout(() => {
                setCopied(false);
            }, 2000);

            return true;
        } catch (error) {
            console.error("Failed to copy:", error);
            return false;
        }
    };

    const handleSocialShare = async (platform: string) => {
        let shareUrl = "";

        switch (platform) {
            case "facebook":
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl)}`;
                break;
            case "twitter":
                shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(propertyUrl)}&text=${encodeURIComponent(`Check out this property: ${propertyTitle}`)}`;
                break;
            case "whatsapp":
                shareUrl = `https://wa.me/?text=${encodeURIComponent(`Check out this property: ${propertyTitle} ${propertyUrl}`)}`;
                break;
            case "email": {
                const subject = encodeURIComponent(`Check out this property: ${propertyTitle}`);
                const body = encodeURIComponent(
                    `I thought you might be interested in this property:\n\n${propertyTitle}\n\n${propertyUrl}`
                );
                shareUrl = `mailto:?subject=${subject}&body=${body}`;
                break;
            }
        }

        if (shareUrl) {
            await createShare.mutateAsync({
                shared_by: sessionUser?.id ?? null,
                unit_id: unitId,
                channel: platform,
                to_value: null,
            });

            if (platform === "email") {
                window.location.href = shareUrl;
            } else {
                window.open(shareUrl, "_blank", "width=600,height=400");
            }
        }
    };

    return {
        copied,
        handleCopyLink,
        handleSocialShare,
        propertyUrl,
    };
}
