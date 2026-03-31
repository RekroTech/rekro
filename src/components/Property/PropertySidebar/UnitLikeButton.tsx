"use client";

import { useOptimistic, useMemo } from "react";
import { clsx } from "clsx";
import { Icon } from "@/components/common";
import { useAuthModal } from "@/contexts";
import { useSessionUser, useToggleUnitLike } from "@/lib/hooks";
import { useToast } from "@/hooks";
import { Heart } from "lucide-react";

interface UnitLikeButtonProps {
    unitId: string;
    propertyId: string;
    /** Liked status (from PropertyCard or PropertySidebar preloaded data) */
    isLiked: boolean;
    /** Like count (from PropertyCard or PropertySidebar preloaded data) */
    likesCount: number;
    isEntireHome?: boolean;
}

export function UnitLikeButton({ 
    unitId, 
    propertyId, 
    isLiked,
    likesCount,
    isEntireHome = false,
}: UnitLikeButtonProps) {
    const { data: user } = useSessionUser();
    const { openAuthModal } = useAuthModal();
    const { showError } = useToast();

    const toggleLikeMutation = useToggleUnitLike();

    // Optimistic UI state for instant feedback
    const [optimisticLiked, setOptimisticLiked] = useOptimistic(
        isLiked,
        (_state, newValue: boolean) => newValue
    );

    // Optimistic likes count (increment/decrement based on like state)
    const optimisticLikesCount = useMemo(() => {
        if (optimisticLiked === isLiked) {
            return likesCount; // No change
        }
        return optimisticLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
    }, [optimisticLiked, isLiked, likesCount]);

    // Toggle like with auth protection
    const handleToggleLike = async () => {
        // Check authentication first
        if (!user) {
            openAuthModal(`/property/${propertyId}`);
            return;
        }

        if (toggleLikeMutation.isPending) return;

        const newLikeState = !optimisticLiked;

        // Optimistically update UI immediately
        setOptimisticLiked(newLikeState);

        try {
            await toggleLikeMutation.mutateAsync({
                unitId,
                isLiked,
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
            disabled={toggleLikeMutation.isPending}
            className={clsx(
                "flex items-center gap-1.5 px-2 py-2 rounded-full transition-all touch-manipulation active:scale-95",
                optimisticLiked
                    ? "bg-danger-500/10 text-danger-500 hover:bg-danger-500/20"
                    : "bg-surface-muted text-text-muted hover:bg-surface-subtle hover:text-danger-500",
                toggleLikeMutation.isPending && "opacity-50 cursor-not-allowed"
            )}
            aria-label={
                optimisticLiked
                    ? `Unsave ${isEntireHome ? "property" : "room"} (${optimisticLikesCount} ${optimisticLikesCount === 1 ? "like" : "likes"})`
                    : `Save ${isEntireHome ? "property" : "room"} (${optimisticLikesCount} ${optimisticLikesCount === 1 ? "like" : "likes"})`
            }
        >
            <Icon
                icon={Heart}
                size={20}
                fill={optimisticLiked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={optimisticLiked ? 0 : 2}
            />
            {optimisticLikesCount > 0 && <span className="text-sm font-medium">{optimisticLikesCount}</span>}
        </button>
    );
}
