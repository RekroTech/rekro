"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Button, Icon } from "@/components/common";
import {
    ApplicationCard,
    AdminApplicationCard,
} from "@/components/Applications";
import type { ApplicationWithDetails, GroupedApplication } from "@/components/Applications";
import { useApplications, useAdminApplications, useRoles } from "@/lib/hooks";
import { ApplicationCardSkeleton } from "@/components/common/Skeleton";


export default function ApplicationsPage() {
    const { hasRoleLevel } = useRoles();
    const isAdmin = hasRoleLevel("admin");

    // Use appropriate hook based on role
    const { data: userApplications, isLoading: isLoadingUser } = useApplications();
    const { data: adminApplications, isLoading: isLoadingAdmin } = useAdminApplications();

    const applications = isAdmin ? adminApplications : userApplications;
    const isLoading = isAdmin ? isLoadingAdmin : isLoadingUser;

    // Group applications by property
    const groupedApplications = useMemo(() => {
        const typedApplications = ((applications || []) as ApplicationWithDetails[]).filter(
            (app) => app.status !== "draft"
        );

        const grouped = new Map<string, GroupedApplication>();

        typedApplications.forEach((app) => {
            const propertyId = app.properties.id;
            if (!grouped.has(propertyId)) {
                grouped.set(propertyId, {
                    property: app.properties,
                    applications: [],
                });
            }
            grouped.get(propertyId)!.applications.push(app);
        });

        // Sort applications within each property by listing_type (entire_home first) then by submitted_at (most recent first)
        grouped.forEach((group) => {
            group.applications.sort((a, b) => {
                // First, sort by listing_type: entire_home before room
                const aIsEntireHome = a.units.listing_type === "entire_home";
                const bIsEntireHome = b.units.listing_type === "entire_home";

                if (aIsEntireHome && !bIsEntireHome) return -1;
                if (!aIsEntireHome && bIsEntireHome) return 1;

                // If both are same type, sort by submitted_at (most recent first)
                return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
            });
        });

        return Array.from(grouped.values());
    }, [applications]);

    if (isLoading) {
        return (
            <div className="h-full bg-app-bg">
                <div className="mx-auto max-w-7xl p-4 sm:px-4 sm:py-8 lg:px-8">
                    <div className="mb-6">
                        <div className="h-8 w-48 bg-surface-muted animate-pulse rounded-md mb-2"></div>
                        <div className="h-4 w-64 bg-surface-muted animate-pulse rounded-md"></div>
                    </div>
                    <div className="space-y-4">
                        <ApplicationCardSkeleton />
                        <ApplicationCardSkeleton />
                        <ApplicationCardSkeleton />
                        <ApplicationCardSkeleton />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-app-bg">
            <div className="mx-auto max-w-7xl p-4 sm:px-4 sm:py-8 lg:px-8">
                {groupedApplications.length === 0 ? (
                    <div className="bg-card rounded-[var(--radius-card-lg)] shadow-[var(--shadow-card)] border border-border p-8 sm:p-12 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="bg-surface-muted rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                                <Icon name="document" className="w-10 h-10 text-text-subtle" />
                            </div>
                            <h3 className="text-xl font-semibold text-text mb-2">
                                No Applications Yet
                            </h3>
                            <p className="text-text-muted mb-6">
                                You haven&apos;t submitted any rental applications yet. Start
                                browsing properties to find your perfect home.
                            </p>
                            <Button
                                variant="primary"
                                size="md"
                                onClick={() => (window.location.href = "/")}
                            >
                                <Icon name="search" className="w-4 h-4 mr-2" />
                                Browse Properties
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 sm:space-y-6">
                        {groupedApplications.map((group) => {
                            const property = group.property;
                            const applications = group.applications;
                            const image = property.images?.[0];

                            return (
                                <div
                                    key={property.id}
                                    className=""
                                >
                                    {/* Property Header */}
                                    <div className="flex flex-col lg:flex-row lg:items-start">
                                        {/* Property Image */}
                                        <div className="rounded-t-[var(--radius-card-lg)] lg:rounded-l-[var(--radius-card-lg)] lg:rounded-tr-none relative w-full lg:w-72 xl:w-80 h-48 sm:h-56 lg:h-64 flex-shrink-0 shadow-[var(--shadow-card)] overflow-hidden">
                                            {image ? (
                                                <Image
                                                    src={image}
                                                    alt={property.title}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 1024px) 100vw, 320px"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-surface-muted flex items-center justify-center">
                                                    <Icon
                                                        name="home"
                                                        className="w-12 h-12 text-text-subtle"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Property Info & Applications */}
                                        <div className="flex-1">
                                            {/* Property Header */}
                                            <div className="bg-card flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 p-4 sm:p-6 sm:pb-4 rounded-b-[var(--radius-card-lg)] lg:rounded-r-[var(--radius-card-lg)] lg:rounded-bl-none border border-border shadow-[var(--shadow-card)]">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-text mb-1.5">
                                                        {property.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-text-muted">
                                                        <Icon
                                                            name="location"
                                                            className="w-4 h-4 flex-shrink-0"
                                                        />
                                                        <span className="truncate">
                                                            {property.location.city},{" "}
                                                            {property.location.state}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        (window.location.href = `/property/${property.id}`)
                                                    }
                                                    className="border border-border flex-shrink-0 w-full sm:w-auto justify-center"
                                                >
                                                    <Icon name="eye" className="w-4 h-4 mr-2" />
                                                    View Property
                                                </Button>
                                            </div>

                                            {/* Applications List - All Visible */}
                                            <div className="space-y-3 sm:pl-3">
                                                {applications.map((application) => (
                                                    isAdmin ? (
                                                        <AdminApplicationCard
                                                            key={application.id}
                                                            application={application}
                                                        />
                                                    ) : (
                                                        <ApplicationCard
                                                            key={application.id}
                                                            application={application}
                                                        />
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
