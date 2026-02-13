"use client";

import { PropertyList } from "@/components";
import { useUser } from "@/lib/react-query/hooks/auth/useAuth";
import { Loader } from "@/components/common";

export default function LikedPropertiesPage() {
    const { data: user, isLoading: userLoading } = useUser();

    if (userLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader size="lg" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 md:py-8 lg:px-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Please Sign In
                    </h1>
                    <p className="text-text-muted">
                        You need to be signed in to view your liked properties.
                    </p>
                </div>
            </div>
        );
    }

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
                userId={user.id}
                likedOnly={true}
                emptyMessage="You haven't liked any properties yet. Start exploring and save your favorites!"
            />
        </main>
    );
}

