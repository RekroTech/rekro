"use client";

import { PropertyList } from "@/components/Properties/PropertyList";
import { BackButton } from "@/components/common";

export default function LikedPropertiesPage() {
    return (
        <main className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4 md:py-6 lg:px-8 lg:py-8">
            {/* Liked Properties Section */}
            <div className="mb-6">
                <BackButton />
            </div>

            {/* Property List */}
            <PropertyList
                likedOnly={true}
                emptyMessage="You haven't liked any properties yet. Start exploring and save your favorites!"
            />
        </main>
    );
}
