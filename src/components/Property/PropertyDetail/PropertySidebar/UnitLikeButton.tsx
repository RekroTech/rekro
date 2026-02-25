"use client";

import { Icon } from "@/components/common";
import { useSessionUser } from "@/lib/react-query/hooks/auth";
import { useAuthModal } from "@/contexts";
import { useToggleUnitLike, useUnitLike, useUnitLikesCount } from "@/lib/react-query/hooks/units";

interface UnitLikeButtonProps {
    unitId: string;
    propertyId: string;
    isEntireHome?: boolean;
}

export function UnitLikeButton({ unitId, propertyId, isEntireHome = false }: UnitLikeButtonProps) {
    const { data: user } = useSessionUser();
    const { openAuthModal } = useAuthModal();

    // Like functionality
    const { data: isLiked = false, isLoading: isLikeLoading } = useUnitLike(unitId);
    const toggleLikeMutation = useToggleUnitLike();
    const { data: likesCount = 0 } = useUnitLikesCount(unitId);

    // Toggle like with auth protection
    const handleToggleLike = async () => {
        // Check authentication first
        if (!user) {
            openAuthModal(`/property/${propertyId}`);
            return;
        }

        if (!unitId || isLikeLoading) return;

        try {
            await toggleLikeMutation.mutateAsync({
                unitId,
                isLiked,
            });
        } catch (error) {
            console.error("Error toggling unit like:", error);
        }
    };

    return (
        <button
            onClick={handleToggleLike}
            disabled={!unitId || isLikeLoading || toggleLikeMutation.isPending}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all touch-manipulation active:scale-95 ${
                isLiked
                    ? "bg-danger-500/10 text-danger-500 hover:bg-danger-500/20"
                    : "bg-surface-muted text-text-muted hover:bg-surface-subtle hover:text-danger-500"
            } ${
                !unitId || isLikeLoading || toggleLikeMutation.isPending
                    ? "opacity-50 cursor-not-allowed"
                    : ""
            }`}
            aria-label={
                !unitId
                    ? `Select a ${isEntireHome ? "property" : "room"} to save`
                    : isLiked
                      ? `Unsave ${isEntireHome ? "property" : "room"} (${likesCount} ${likesCount === 1 ? "like" : "likes"})`
                      : `Save ${isEntireHome ? "property" : "room"} (${likesCount} ${likesCount === 1 ? "like" : "likes"})`
            }
        >
            <Icon
                name="heart"
                className="w-5 h-5"
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={isLiked ? 0 : 2}
            />
            {unitId && likesCount > 0 && (
                <span className="text-sm font-medium">{likesCount}</span>
            )}
        </button>
    );
}

