"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import type { Address, Location } from "@/types/db";
import { Button, Icon, Dropdown } from "@/components/common";
import type { DropdownItem } from "@/components/common/Dropdown";
import { useApplications, useWithdrawApplication } from "@/lib/hooks";
import {
    formatDateShort,
    formatDistanceToNow,
    formatRentalDuration,
    generateApplicationPDF,
} from "@/lib/utils";

interface ApplicationWithDetails {
    id: string;
    status: string;
    created_at: string;
    submitted_at: string;
    updated_at: string;
    move_in_date: string;
    rental_duration: number;
    proposed_rent: number | null;
    total_rent: number;
    message: string | null;
    properties: {
        id: string;
        title: string;
        address: Address;
        images: string[] | null;
        location: Location;
    };
    units: {
        id: string;
        name: string;
        listing_type: string;
        price: number;
    };
}

interface GroupedApplication {
    property: ApplicationWithDetails["properties"];
    applications: ApplicationWithDetails[];
}

interface ApplicationCardProps {
    application: ApplicationWithDetails;
    onWithdraw: (id: string) => void;
    onDownload: (application: ApplicationWithDetails) => void;
    isWithdrawing: boolean;
    getStatusColor: (status: string) => string;
    getStatusIcon: (status: string) => "document" | "info-circle" | "check-circle" | "alert-circle" | "x";
    canWithdraw: (status: string) => boolean;
}

function ApplicationCard({
    application,
    onWithdraw,
    onDownload,
    isWithdrawing,
    getStatusColor,
    getStatusIcon,
    canWithdraw,
}: ApplicationCardProps) {
    const unit = application.units;

    const dropdownItems: DropdownItem[] = [
        {
            label: "Download PDF",
            icon: <Icon name="download" className="w-4 h-4" />,
            onClick: () => onDownload(application),
        },
        ...(canWithdraw(application.status)
            ? [
                  {
                      label: isWithdrawing ? "Withdrawing..." : "Withdraw Application",
                      icon: <Icon name="x" className="w-4 h-4" />,
                      onClick: () => onWithdraw(application.id),
                      variant: "danger" as const,
                      disabled: isWithdrawing,
                  },
              ]
            : []),
    ];

    return (
        <div className="bg-card rounded-[var(--radius-card)] border border-border p-3 sm:p-4 sm:px-5">
            {/* First Row: Unit Name with Status Chip, Price, and Settings */}
            <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 sm:gap-2 mb-1">
                        <h4 className="text-sm sm:text-base font-semibold text-text">
                            {unit.name}
                        </h4>
                        <div
                            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border text-xs font-medium ${getStatusColor(application.status)} whitespace-nowrap`}
                        >
                            <Icon name={getStatusIcon(application.status)} className="w-3.5 h-3.5" />
                            <span className="capitalize">{application.status.replace("_", " ")}</span>
                        </div>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-primary-600">
                        ${application.total_rent}
                        <span className="text-sm font-normal text-text-muted">/week</span>
                    </p>
                </div>

                {/* Settings Dropdown */}
                <Dropdown
                    trigger={
                        <div className="hover:bg-surface-muted rounded-md transition-colors">
                            <Icon name="settings" className="w-5 h-5 text-text-subtle" />
                        </div>
                    }
                    items={dropdownItems}
                    align="right"
                />
            </div>

            {/* Second Row: Application Details with Labels */}
            <div className="flex items-center justify-between gap-2 sm:gap-6">
                <div className="flex items-start sm:items-center gap-3 sm:gap-6 overflow-x-auto">
                    <div className="flex-shrink-0">
                        <p className="text-xs text-text-subtle mb-1">Reference</p>
                        <p className="text-xs sm:text-sm text-text font-mono font-medium">
                            #{application.id.substring(0, 8).toUpperCase()}
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <p className="text-xs text-text-subtle mb-1">Move-in Date</p>
                        <p className="text-xs sm:text-sm text-text font-medium">
                            {formatDateShort(application.move_in_date)}
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <p className="text-xs text-text-subtle mb-1">Duration</p>
                        <p className="text-xs sm:text-sm text-text font-medium">
                            {formatRentalDuration(application.rental_duration)}
                        </p>
                    </div>
                </div>

                {/* Timestamp */}
                <div className="text-right flex-shrink-0 self-end">
                    <p className="text-[10px] sm:text-sm text-text-muted whitespace-nowrap">
                        {formatDistanceToNow(new Date(application.submitted_at), {
                            addSuffix: true,
                        })}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function ApplicationsPage() {
    const { data: applications, isLoading } = useApplications();
    const { mutate: withdrawApplication, isPending } = useWithdrawApplication();
    const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

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


    const handleWithdraw = (applicationId: string) => {
        if (
            confirm(
                "Are you sure you want to withdraw this application? This action cannot be undone."
            )
        ) {
            setWithdrawingId(applicationId);
            withdrawApplication(applicationId);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "submitted":
                return "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-700";
            case "under_review":
                return "bg-warning-50 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 border-warning-200 dark:border-warning-700";
            case "approved":
                return "bg-success-bg dark:bg-success-bg text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-700";
            case "rejected":
                return "bg-danger-500/10 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 border-danger-500/20 dark:border-danger-700";
            case "withdrawn":
                return "bg-surface-muted dark:bg-surface-muted text-text-muted dark:text-text-muted border-border dark:border-border";
            default:
                return "bg-surface-muted dark:bg-surface-muted text-text-muted dark:text-text-muted border-border dark:border-border";
        }
    };

    const getStatusIcon = (status: string): "document" | "info-circle" | "check-circle" | "alert-circle" | "x" => {
        switch (status) {
            case "submitted":
                return "document";
            case "under_review":
                return "info-circle";
            case "approved":
                return "check-circle";
            case "rejected":
                return "alert-circle";
            case "withdrawn":
                return "x";
            default:
                return "document";
        }
    };

    const canWithdraw = (status: string) => {
        return status === "submitted" || status === "under_review";
    };

    const downloadApplication = (application: ApplicationWithDetails) => {
        const property = application.properties;
        const unit = application.units;

        if (!property || !unit) return;

        // Generate PDF using the utility function
        generateApplicationPDF({
            id: application.id,
            status: application.status,
            submitted_at: application.submitted_at,
            created_at: application.created_at,
            updated_at: application.updated_at,
            move_in_date: application.move_in_date,
            rental_duration: application.rental_duration,
            proposed_rent: application.proposed_rent,
            total_rent: application.total_rent,
            message: application.message,
            property: {
                title: property.title,
                location: {
                    city: property.location.city,
                    state: property.location.state,
                },
            },
            unit: {
                name: unit.name,
                listing_type: unit.listing_type,
                price: unit.price,
            },
        });
    };

    if (isLoading) {
        return (
            <div className="h-full bg-app-bg">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
                            <p className="text-text-muted">Loading applications...</p>
                        </div>
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
                                                    <ApplicationCard
                                                        key={application.id}
                                                        application={application}
                                                        onWithdraw={handleWithdraw}
                                                        onDownload={downloadApplication}
                                                        isWithdrawing={
                                                            isPending &&
                                                            withdrawingId === application.id
                                                        }
                                                        getStatusColor={getStatusColor}
                                                        getStatusIcon={getStatusIcon}
                                                        canWithdraw={canWithdraw}
                                                    />
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
