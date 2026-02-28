"use client";

import { useOptimistic } from "react";
import { Icon } from "@/components/common";
import { useAuthModal } from "@/contexts";
import { useSessionUser, useToggleUnitLike, useUnitLike, useUnitLikesCount } from "@/lib/hooks";
import { useToast } from "@/hooks";

interface UnitLikeButtonProps {
    unitId: string;
    propertyId: string;
    isEntireHome?: boolean;
}

export function UnitLikeButton({ unitId, propertyId, isEntireHome = false }: UnitLikeButtonProps) {
    const { data: user } = useSessionUser();
    const { openAuthModal } = useAuthModal();
    const { showError } = useToast();

    // Like functionality
    const { data: isLiked = false, isLoading: isLikeLoading } = useUnitLike(unitId);
    const toggleLikeMutation = useToggleUnitLike();
    const { data: likesCount = 0 } = useUnitLikesCount(unitId);

    // Optimistic UI state for instant feedback
    const [optimisticLiked, setOptimisticLiked] = useOptimistic(
        isLiked,
        (_state, newValue: boolean) => newValue
    );

    // Toggle like with auth protection
    const handleToggleLike = async () => {
        // Check authentication first
        if (!user) {
            openAuthModal(`/property/${propertyId}`);
            return;
        }

        if (!unitId || isLikeLoading) return;

        const newLikeState = !optimisticLiked;

        // Optimistically update UI immediately
        setOptimisticLiked(newLikeState);

        try {
            await toggleLikeMutation.mutateAsync({
                unitId,
                isLiked: !isLiked, // Use actual server state for mutation
            });
        } catch (error) {
            // Revert optimistic update on error
            setOptimisticLiked(!newLikeState);
            showError("Failed to update. Please try again.");
            console.error("Error toggling unit like:", error);
        }
    };

    return (
        <button
            onClick={handleToggleLike}
            disabled={!unitId || isLikeLoading}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all touch-manipulation active:scale-95 ${
                optimisticLiked
                    ? "bg-danger-500/10 text-danger-500 hover:bg-danger-500/20"
                    : "bg-surface-muted text-text-muted hover:bg-surface-subtle hover:text-danger-500"
            } ${
                !unitId || isLikeLoading
                    ? "opacity-50 cursor-not-allowed"
                    : ""
            }`}
            aria-label={
                !unitId
                    ? `Select a ${isEntireHome ? "property" : "room"} to save`
                    : optimisticLiked
                      ? `Unsave ${isEntireHome ? "property" : "room"} (${likesCount} ${likesCount === 1 ? "like" : "likes"})`
                      : `Save ${isEntireHome ? "property" : "room"} (${likesCount} ${likesCount === 1 ? "like" : "likes"})`
            }
        >
            <Icon
                name="heart"
                className="w-5 h-5"
                fill={optimisticLiked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={optimisticLiked ? 0 : 2}
            />
            {unitId && likesCount > 0 && <span className="text-sm font-medium">{likesCount}</span>}
        </button>
    );
}
