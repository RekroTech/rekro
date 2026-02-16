"use client";

import { PropertyList } from "@/components";

export default function LikedPropertiesPage() {
    return (
        <main className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4 md:py-6 lg:px-8 lg:py-8">
            {/* Liked Properties Section */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                    Liked Properties
                </h1>
                <p className="text-sm sm:text-base text-text-muted">
                    Properties and rooms you&apos;ve saved for later
                </p>
            </div>

            {/* Property List */}
            <PropertyList
                likedOnly={true}
                emptyMessage="You haven't liked any properties yet. Start exploring and save your favorites!"
            />
        </main>
    );
}
