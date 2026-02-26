"use client";

import { useState } from "react";
import Image from "next/image";
import type { Address, Location } from "@/types/db";
import { Button, Icon } from "@/components/common";
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

export default function ApplicationsPage() {
    const { data: applications, isLoading } = useApplications();
    const { mutate: withdrawApplication, isPending } = useWithdrawApplication();
    const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

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
                return "bg-primary-50 text-primary-700 border-primary-200";
            case "under_review":
                return "bg-warning-50 text-warning-700 border-warning-200";
            case "approved":
                return "bg-success-bg text-primary-600 border-primary-200";
            case "rejected":
                return "bg-danger-500/10 text-danger-600 border-danger-500/20";
            case "withdrawn":
                return "bg-surface-muted text-text-muted border-border";
            default:
                return "bg-surface-muted text-text-muted border-border";
        }
    };

    const getStatusIcon = (status: string) => {
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
            <div className="min-h-screen bg-app-bg">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                            <p className="text-text-muted">Loading applications...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const typedApplications = ((applications || []) as ApplicationWithDetails[]).filter(
        (app) => app.status !== "draft"
    );

    return (
        <div className="min-h-screen bg-app-bg">
            <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8 lg:px-8">
                {typedApplications.length === 0 ? (
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
                        {typedApplications.map((application) => {
                            const property = application.properties;
                            const unit = application.units;
                            const image = property.images?.[0];

                            return (
                                <div
                                    key={application.id}
                                    className="bg-card rounded-[var(--radius-card-lg)] shadow-[var(--shadow-card)] border border-border overflow-hidden hover:shadow-[var(--shadow-lift)] transition-all duration-200"
                                >
                                    <div className="flex flex-col lg:flex-row">
                                        {/* Property Image */}
                                        <div className="relative w-full lg:w-64 xl:w-80 h-48 lg:h-auto flex-shrink-0">
                                            {image ? (
                                                <Image
                                                    src={image}
                                                    alt={property.title}
                                                    fill
                                                    className="object-cover"
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

                                        {/* Application Details */}
                                        <div className="flex-1 p-5 sm:p-6">
                                            {/* Header with Title and Status */}
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                                                <div className="flex-1">
                                                    <h3 className="text-lg sm:text-xl font-semibold text-text mb-1.5">
                                                        {property.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-sm text-text-muted mb-3">
                                                        <Icon name="location" className="w-4 h-4" />
                                                        <span>
                                                            {property.location.city},{" "}
                                                            {property.location.state}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <span className="px-2.5 py-1 bg-surface-subtle text-text-muted rounded-md">
                                                            {unit.listing_type === "entire_home"
                                                                ? "Entire Home"
                                                                : "Room"}
                                                        </span>
                                                        <span className="font-semibold text-base text-text">
                                                            ${application.total_rent}/week
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Status Badge */}
                                                <div className="flex sm:flex-col items-start sm:items-end gap-2">
                                                    <div
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusColor(application.status)} whitespace-nowrap`}
                                                    >
                                                        <Icon
                                                            name={getStatusIcon(application.status)}
                                                            className="w-4 h-4"
                                                        />
                                                        <span className="text-sm font-medium capitalize">
                                                            {application.status.replace("_", " ")}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-text-subtle sm:text-right">
                                                        {formatDistanceToNow(
                                                            new Date(application.submitted_at),
                                                            { addSuffix: true }
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Application Info Grid */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-y border-border">
                                                <div>
                                                    <p className="text-xs text-text-subtle mb-1">
                                                        Reference
                                                    </p>
                                                    <p className="text-sm text-text font-mono">
                                                        #
                                                        {application.id
                                                            .substring(0, 8)
                                                            .toUpperCase()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-text-subtle mb-1">
                                                        Move-in Date
                                                    </p>
                                                    <p className="text-sm text-text font-medium">
                                                        {formatDateShort(application.move_in_date)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-text-subtle mb-1">
                                                        Duration
                                                    </p>
                                                    <p className="text-sm text-text font-medium">
                                                        {formatRentalDuration(
                                                            application.rental_duration
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-wrap gap-2 pt-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        (window.location.href = `/property/${property.id}`)
                                                    }
                                                    className="border border-border"
                                                >
                                                    <Icon name="eye" className="w-4 h-4 mr-2" />
                                                    View Property
                                                </Button>
                                                <div className="flex-1" />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => downloadApplication(application)}
                                                    className="border border-border"
                                                >
                                                    <Icon
                                                        name="download"
                                                        className="w-4 h-4 mr-2"
                                                    />
                                                    Download
                                                </Button>
                                                {canWithdraw(application.status) && (
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleWithdraw(application.id)
                                                        }
                                                        disabled={
                                                            isPending &&
                                                            withdrawingId === application.id
                                                        }
                                                    >
                                                        <Icon name="x" className="w-4 h-4 mr-2" />
                                                        {isPending &&
                                                        withdrawingId === application.id
                                                            ? "Withdrawing..."
                                                            : "Withdraw"}
                                                    </Button>
                                                )}
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
