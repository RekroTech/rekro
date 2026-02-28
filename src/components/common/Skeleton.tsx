import { clsx } from "clsx";

export interface SkeletonProps {
    className?: string;
    variant?: "text" | "circular" | "rectangular";
    width?: string | number;
    height?: string | number;
    animation?: "pulse" | "wave" | "none";
}

/**
 * Skeleton loading component for better perceived performance
 * Use with Suspense boundaries for optimal UX
 */
export function Skeleton({
    className,
    variant = "rectangular",
    width,
    height,
    animation = "pulse",
}: SkeletonProps) {
    const animationClass = {
        pulse: "animate-pulse",
        wave: "animate-shimmer",
        none: "",
    }[animation];

    const variantClass = {
        text: "rounded-sm",
        circular: "rounded-full",
        rectangular: "rounded-[var(--radius-md)]",
    }[variant];

    const style = {
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
    };

    return (
        <div
            className={clsx(
                "bg-surface-muted",
                variantClass,
                animationClass,
                className
            )}
            style={style}
        />
    );
}

/**
 * Skeleton for property card
 */
export function PropertyCardSkeleton() {
    return (
        <div className="rounded-[var(--radius-lg)] border border-border bg-card overflow-hidden">
            <Skeleton height={256} className="w-full" variant="rectangular" />
            <div className="p-4 space-y-3">
                <Skeleton height={20} width="70%" />
                <Skeleton height={16} width="50%" />
                <div className="flex gap-4 mt-3">
                    <Skeleton height={14} width={60} />
                    <Skeleton height={14} width={60} />
                    <Skeleton height={14} width={60} />
                </div>
            </div>
        </div>
    );
}

/**
 * Skeleton for property list grid
 */
export function PropertyListSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
            ))}
        </div>
    );
}

/**
 * Skeleton for application card
 */
export function ApplicationCardSkeleton() {
    return (
        <div className="bg-card rounded-[var(--radius-card)] border border-border p-4">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <Skeleton height={20} width="60%" className="mb-2" />
                    <Skeleton height={24} width="40%" />
                </div>
                <Skeleton variant="circular" width={24} height={24} />
            </div>
            <div className="flex gap-6">
                <Skeleton height={14} width={80} />
                <Skeleton height={14} width={80} />
                <Skeleton height={14} width={80} />
            </div>
        </div>
    );
}

/**
 * Skeleton for property detail page
 */
export function PropertyDetailSkeleton() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            {/* Back button skeleton */}
            <div className="mb-4">
                <Skeleton width={100} height={32} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content - left side */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Image gallery skeleton */}
                    <Skeleton height={400} className="w-full rounded-lg" />

                    {/* Property header skeleton */}
                    <div className="space-y-3">
                        <Skeleton height={32} width="70%" />
                        <Skeleton height={20} width="50%" />
                        <div className="flex gap-4">
                            <Skeleton height={20} width={80} />
                            <Skeleton height={20} width={80} />
                            <Skeleton height={20} width={80} />
                        </div>
                    </div>

                    {/* Description skeleton */}
                    <div className="space-y-2">
                        <Skeleton height={20} width="100%" />
                        <Skeleton height={20} width="95%" />
                        <Skeleton height={20} width="90%" />
                    </div>

                    {/* Amenities skeleton */}
                    <div className="grid grid-cols-2 gap-3">
                        <Skeleton height={60} />
                        <Skeleton height={60} />
                        <Skeleton height={60} />
                        <Skeleton height={60} />
                    </div>
                </div>

                {/* Sidebar skeleton - right side */}
                <div className="lg:col-span-1">
                    <div className="sticky top-20 space-y-4">
                        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                            <Skeleton height={40} width="60%" />
                            <Skeleton height={100} />
                            <Skeleton height={48} className="w-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

