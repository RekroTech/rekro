"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { clsx } from "clsx";
import { Icon } from "@/components/common/Icon";
import { Loader } from "@/components/common";
import { useUserLikes } from "@/lib/react-query/hooks/user";

interface UsersWhoLikedCarouselProps {
    propertyId: string;
    className?: string;
}

export const LikedUsersCarousal: React.FC<UsersWhoLikedCarouselProps> = ({
    propertyId,
    className,
}) => {
    // Fetch users who liked any unit in this property
    const { data: users, isLoading } = useUserLikes(propertyId);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    // Modal state to show user details
    const [modalUserId, setModalUserId] = useState<string | null>(null);

    const checkScroll = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        setCanScrollLeft(container.scrollLeft > 0);
        setCanScrollRight(
            container.scrollLeft < container.scrollWidth - container.clientWidth - 1
        );
    };

    const scroll = (direction: "left" | "right") => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const scrollAmount = 400; // Adjusted for wider cards (w-80)
        const newScrollLeft =
            direction === "left"
                ? container.scrollLeft - scrollAmount
                : container.scrollLeft + scrollAmount;

        container.scrollTo({
            left: newScrollLeft,
            behavior: "smooth",
        });

        setTimeout(checkScroll, 300);
    };

    // Show loading state (skip if using dummy data)
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader size="md" />
            </div>
        );
    }

    if (!users || users.length === 0) {
        return null;
    }

    return (
        <div className={clsx("relative w-full", className)}>
            {/* Header */}
            <div className="mb-4 sm:mb-6 px-2 sm:px-0">
                <h6 className="text-xl sm:text-2xl font-bold text-text">
                    People Interested
                </h6>
            </div>

            {/* Carousel Container */}
            <div className="relative group/carousel">
                {/* Left Navigation */}
                {canScrollLeft && (
                    <button
                        onClick={() => scroll("left")}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 bg-white shadow-xl rounded-full p-3 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-surface"
                        aria-label="Scroll left"
                    >
                        <Icon name="chevron-left" className="text-text w-5 h-5" />
                    </button>
                )}

                {/* Cards Container */}
                <div
                    ref={scrollContainerRef}
                    onScroll={checkScroll}
                    className="flex gap-6 overflow-x-auto scrollbar-hide py-2"
                    style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                    }}
                >
                    {users.map((user) => {
                        const displayName = user.full_name || user.username || "Anonymous";
                        const altText = user.full_name || user.username || "User";

                        return (
                            <div
                                key={user.user_id}
                                className="card border border-border p-4 flex-shrink-0 w-48 text-text hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
                                role="button"
                                tabIndex={0}
                                onClick={() => setModalUserId(user.user_id)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setModalUserId(user.user_id);
                                    }
                                }}
                            >
                                <div className="text-center">
                                    <div className="relative mx-auto mb-3">
                                        {user.image_url ? (
                                            <div className="w-32 h-32 rounded-full overflow-hidden bg-surface-muted border-2 border-border mx-auto">
                                                <Image
                                                    src={user.image_url}
                                                    alt={altText}
                                                    width={128}
                                                    height={128}
                                                    className="w-full h-full object-cover"
                                                    unoptimized
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-32 h-32 rounded-full bg-surface-muted flex items-center justify-center border-2 border-border mx-auto">
                                                <Icon name="profile" className="w-14 h-14 text-text-muted" />
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-base font-bold text-text truncate">
                                        {displayName}
                                    </h3>

                                    {user.username && user.full_name && (
                                        <p className="text-xs text-text-muted truncate">
                                            @{user.username}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Right Navigation */}
                {canScrollRight && (
                    <button
                        onClick={() => scroll("right")}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 bg-white shadow-xl rounded-full p-3 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-surface"
                        aria-label="Scroll right"
                    >
                        <Icon name="chevron-right" className="text-text w-5 h-5" />
                    </button>
                )}
            </div>

            {/* User Details Modal */}
            {modalUserId && (() => {
                const user = users.find(u => u.user_id === modalUserId);
                if (!user) return null;

                const displayName = user.full_name || user.username || "Anonymous";
                const altText = user.full_name || user.username || "User";

                return (
                    <div
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setModalUserId(null)}
                    >
                        <div
                            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white border-b border-border p-6 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-text">User Profile</h2>
                                <button
                                    onClick={() => setModalUserId(null)}
                                    className="p-2 hover:bg-surface rounded-full transition-colors"
                                    aria-label="Close modal"
                                >
                                    <Icon name="close" className="w-6 h-6 text-text" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6">
                                {/* Profile Section */}
                                <div className="flex flex-col items-center text-center mb-6">
                                    <div className="relative mb-4">
                                        {user.image_url ? (
                                            <div className="w-40 h-40 rounded-full overflow-hidden bg-surface-muted border-2 border-border">
                                                <Image
                                                    src={user.image_url}
                                                    alt={altText}
                                                    width={160}
                                                    height={160}
                                                    className="w-full h-full object-cover"
                                                    unoptimized
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-40 h-40 rounded-full bg-surface-muted flex items-center justify-center border-2 border-border">
                                                <Icon name="profile" className="w-20 h-20 text-text-muted" />
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-2xl font-bold text-text mb-2">
                                        {displayName}
                                    </h3>

                                    {user.username && (
                                        <p className="text-base text-text-muted mb-2">
                                            @{user.username}
                                        </p>
                                    )}

                                    {user.occupation && (
                                        <p className="text-base text-text font-medium">
                                            {user.occupation}
                                        </p>
                                    )}
                                </div>

                                {/* Bio */}
                                {user.bio && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-text mb-2">About</h4>
                                        <div className="p-4 bg-surface-subtle rounded-lg border border-border">
                                            <p className="text-sm text-text-muted italic">
                                                &#34;{user.bio}&#34;
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Details */}
                                {user.native_language && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-text mb-3">Details</h4>
                                        <div className="flex items-center gap-3">
                                            <Icon name="map" className="w-5 h-5 text-text-muted flex-shrink-0" />
                                            <span className="text-base text-text">{user.native_language}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Liked Units */}
                                {user.unit_names && user.unit_names.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-text mb-3">Interested In</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {user.unit_names.map((unitName: string, idx: number) => (
                                                <span
                                                    key={idx}
                                                    className="px-4 py-2 bg-primary-100 text-primary-700 text-sm font-medium rounded-full"
                                                >
                                                    {unitName}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="pt-6 border-t border-border">
                                    <button
                                        type="button"
                                        className="w-full px-6 py-3 rounded-lg border border-border bg-surface hover:bg-surface-subtle text-base font-semibold text-text-muted cursor-not-allowed transition-colors"
                                        disabled
                                    >
                                        Contact User (Coming Soon)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

