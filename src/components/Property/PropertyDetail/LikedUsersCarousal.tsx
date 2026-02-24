"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { clsx } from "clsx";
import { Icon } from "@/components/common/Icon";
import { Loader } from "@/components/common";
import { useUserLikes } from "@/lib/react-query/hooks/property";

interface UsersWhoLikedCarouselProps {
    propertyId: string;
    className?: string;
    useDummyData?: boolean; // For UI testing
}

// Dummy data for UI testing
const DUMMY_USERS = [
    {
        property_id: "dummy-property-1",
        user_id: "user-1",
        full_name: "Sarah Johnson",
        username: "sarahj",
        image_url: "https://i.pravatar.cc/150?img=1",
        occupation: "Software Engineer",
        bio: "Looking for a cozy place near the city center. Love cooking and yoga!",
        native_language: "English",
        unit_ids: ["unit-1", "unit-2"],
        unit_names: ["Unit A - 2BR", "Unit B - 1BR"],
    },
    {
        property_id: "dummy-property-1",
        user_id: "user-2",
        full_name: "Michael Chen",
        username: "mchen",
        image_url: "https://i.pravatar.cc/150?img=12",
        occupation: "Product Designer",
        bio: "Minimalist who appreciates modern design and natural light. Non-smoker, quiet tenant.",
        native_language: "Mandarin",
        unit_ids: ["unit-3"],
        unit_names: ["Unit C - Studio"],
    },
    {
        property_id: "dummy-property-1",
        user_id: "user-3",
        full_name: "Emma Williams",
        username: "emmaw",
        image_url: "https://i.pravatar.cc/150?img=5",
        occupation: "Marketing Manager",
        bio: "Professional seeking a modern apartment. I work from home occasionally and value peace and quiet.",
        native_language: "English",
        unit_ids: ["unit-1"],
        unit_names: ["Unit A - 2BR"],
    },
    {
        property_id: "dummy-property-1",
        user_id: "user-4",
        full_name: "James Anderson",
        username: null,
        image_url: null,
        occupation: "Teacher",
        bio: null,
        native_language: "Spanish",
        unit_ids: ["unit-2", "unit-3"],
        unit_names: ["Unit B - 1BR", "Unit C - Studio"],
    },
    {
        property_id: "dummy-property-1",
        user_id: "user-5",
        full_name: "Priya Patel",
        username: "priyap",
        image_url: "https://i.pravatar.cc/150?img=9",
        occupation: "Data Analyst",
        bio: "Clean, responsible tenant looking for a long-term rental. Love reading and hiking on weekends.",
        native_language: "Hindi",
        unit_ids: ["unit-1", "unit-2", "unit-3"],
        unit_names: ["Unit A - 2BR", "Unit B - 1BR", "Unit C - Studio"],
    },
    {
        property_id: "dummy-property-1",
        user_id: "user-6",
        full_name: null,
        username: "alexm",
        image_url: "https://i.pravatar.cc/150?img=13",
        occupation: null,
        bio: "Recent graduate starting a new job in the area.",
        native_language: null,
        unit_ids: ["unit-2"],
        unit_names: ["Unit B - 1BR"],
    },
    {
        property_id: "dummy-property-1",
        user_id: "user-7",
        full_name: "Olivia Martinez",
        username: "oliviam",
        image_url: "https://i.pravatar.cc/150?img=10",
        occupation: "Graphic Designer",
        bio: "Creative professional with a cat. Looking for a pet-friendly place with good natural lighting.",
        native_language: "English",
        unit_ids: ["unit-1"],
        unit_names: ["Unit A - 2BR"],
    },
    {
        property_id: "dummy-property-1",
        user_id: "user-8",
        full_name: "Daniel Kim",
        username: "dkim",
        image_url: null,
        occupation: "Financial Analyst",
        bio: "Quiet professional seeking a clean, modern apartment. Non-smoker, no pets.",
        native_language: "Korean",
        unit_ids: ["unit-3"],
        unit_names: ["Unit C - Studio"],
    },
];

export const LikedUsersCarousal: React.FC<UsersWhoLikedCarouselProps> = ({
    propertyId,
    className,
    useDummyData = false,
}) => {
    // Fetch users who liked any unit in this property
    const { data: users, isLoading } = useUserLikes(propertyId);

    // Use dummy data if the prop is set, otherwise use real data
    const displayUsers = useDummyData ? DUMMY_USERS : users;

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
    if (isLoading && !useDummyData) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader size="md" />
            </div>
        );
    }

    if (!displayUsers || displayUsers.length === 0) {
        return null;
    }

    return (
        <div className={clsx("relative w-full", className)}>
            {/* Header */}
            <div className="mb-4 sm:mb-6 px-2 sm:px-0">
                <h6 className="text-xl sm:text-2xl font-bold text-text">
                    People Interested in This Property
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
                    {displayUsers.map((user) => {
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
                const user = displayUsers.find(u => u.user_id === modalUserId);
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
                                            {user.unit_names.map((unitName, idx) => (
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

