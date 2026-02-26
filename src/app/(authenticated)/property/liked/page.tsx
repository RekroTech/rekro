"use client";

import Link from "next/link";
import { PropertyList } from "@/components/Properties/PropertyList";
import { Icon } from "@/components/common";

export default function LikedPropertiesPage() {
    return (
        <main className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4 md:py-6 lg:px-8 lg:py-8">

            {/* Property List */}
            <PropertyList
                likedOnly={true}
                emptyMessage="You haven't liked any properties yet. Start exploring and save your favorites!"
                emptyStateAction={
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                    >
                        <Icon name="search" className="h-5 w-5" />
                        Browse Properties
                    </Link>
                }
            />
        </main>
    );
}
