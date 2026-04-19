"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { User, CheckCircle, X, Mail, RotateCcw } from "lucide-react";
import Image from "next/image";
import { Icon, Button } from "@/components/common";
import { formatDateShort, formatDistanceToNow, formatRentalDuration } from "@/lib/utils";
import type { ApplicationWithDetails } from "./types";
import { ApplicationDetailsModal } from "./ApplicationDetailsModal";
import { useUpdateApplicationStatus } from "@/lib/hooks";
import { useToast } from "@/hooks/useToast";

export interface AdminApplicationCardProps {
    application: ApplicationWithDetails;
}

export function AdminApplicationCard({ application }: AdminApplicationCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const { mutateAsync: updateStatus } = useUpdateApplicationStatus();
    const { showSuccess, showError } = useToast();
    const unit = application.units;
    const previousStatus = application.status;

    const handleStatusChange = async (newStatus: string) => {
        setIsUpdatingStatus(true);
        try {
            await updateStatus({
                applicationId: application.id,
                status: newStatus,
            });
            const successMessageByStatus: Record<string, string> = {
                approved: "Application approved successfully",
                rejected: "Application rejected successfully",
                under_review:
                    previousStatus === "approved"
                        ? "Approval undone. Application moved to review"
                        : previousStatus === "rejected"
                          ? "Rejection undone. Application moved to review"
                          : "Application moved to review",
            };
            showSuccess(successMessageByStatus[newStatus] || "Application status updated successfully");
        } catch (error) {
            console.error("Error updating status:", error);
            showError("Failed to update application status");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleCardClick = () => {
        // Open modal immediately
        setIsModalOpen(true);

        // Automatically set to under_review if currently submitted (async, non-blocking)
        if (application.status === "submitted") {
            updateStatus({
                applicationId: application.id,
                status: "under_review",
            }).catch((error) => {
                console.error("Error auto-updating status:", error);
                // Silently fail - don't disrupt user experience
            });
        }
    };

    const canTakeAction = !["approved", "rejected", "withdrawn"].includes(application.status);
    const canUndoApprove = application.status === "approved";
    const canUndoReject = application.status === "rejected";
    const canUndoDecision = canUndoApprove || canUndoReject;
    const undoLabel = canUndoApprove ? "Undo Approve" : "Undo Reject";
    const statusLabel = application.status.replace(/_/g, " ");

    return (
        <>
            <div
                onClick={handleCardClick}
                className="bg-card rounded-card overflow-hidden border border-border hover:border-primary-500/30 hover:shadow-lift transition-all duration-200 cursor-pointer p-3 sm:p-0"
                data-testid="application-card"
            >
                {/* Mobile & Tablet Layout */}
                <div className="flex flex-col gap-3 sm:hidden">
                    {/* Top Row: Image on left, Name/Email and Unit info stacked on right */}
                    <div className="flex gap-3">
                        {/* Applicant Photo */}
                        <div className="shrink-0">
                            {application.applicant?.image_url ? (
                                <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                                    <Image
                                        src={application.applicant.image_url}
                                        alt={application.applicant.full_name || "Applicant"}
                                        fill
                                        className="object-cover"
                                        sizes="96px"
                                    />
                                </div>
                            ) : (
                                <div className="w-24 h-24 rounded-lg bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500/20 flex items-center justify-center">
                                    <Icon
                                        icon={User}
                                        size={48}
                                        className="text-primary-600 dark:text-primary-400"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Name, Email, Unit info column */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                            {/* Name & Email */}
                            <div>
                                <div className="flex justify-between gap-2 mb-0.5">
                                   <div>
                                    <h3 className="text-base font-bold text-text truncate">
                                        {application.applicant?.full_name || "N/A"}
                                    </h3>

                                    {application.applicant?.email && (
                                        <a
                                            href={`mailto:${application.applicant.email}`}
                                            className="text-xs text-primary-600 hover:text-primary-700 transition-colors truncate block"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {application.applicant.email}
                                        </a>
                                    )}
                                   </div>
                                    <div
                                        className={clsx(
                                            "px-2 py-0.5 rounded-full border shrink-0 h-fit self-start",
                                            application.status === "approved"
                                                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                                : application.status === "rejected"
                                                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                                  : application.status === "under_review"
                                                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                                    : "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700"
                                        )}
                                    >
                                        <span
                                            className={clsx(
                                                "text-xs font-medium capitalize leading-tight",
                                                application.status === "approved"
                                                    ? "text-green-700 dark:text-green-300"
                                                    : application.status === "rejected"
                                                      ? "text-red-700 dark:text-red-300"
                                                      : application.status === "under_review"
                                                        ? "text-blue-700 dark:text-blue-300"
                                                        : "text-gray-700 dark:text-gray-300"
                                            )}
                                        >
                                            {statusLabel}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Unit Name, Rent, Proposed Rent */}
                            <div className="mt-2">
                                <h4 className="text-sm font-semibold text-text truncate mb-0.5">
                                    {unit.name}
                                </h4>
                                <p className="text-sm font-bold text-primary-600">
                                    ${application.total_rent}
                                    <span className="text-xs font-normal text-text-muted">/wk</span>
                                </p>
                                {application.proposed_rent &&
                                    application.proposed_rent !== application.total_rent && (
                                        <p className="text-xs text-text-muted">
                                            proposed rent: ${application.proposed_rent}
                                        </p>
                                    )}
                            </div>
                        </div>
                    </div>

                    {/* Application Details Row: Reference, Move-in, Duration */}
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[10px] text-text-subtle mb-0.5">reference</p>
                            <p className="font-mono text-xs font-medium text-text">
                                #{application.id.substring(0, 6).toUpperCase()}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-text-subtle mb-0.5">moveindate</p>
                            <p className="text-xs font-medium text-text whitespace-nowrap">
                                {formatDateShort(application.move_in_date)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-text-subtle mb-0.5">duration</p>
                            <p className="text-xs font-medium text-text whitespace-nowrap">
                                {formatRentalDuration(application.rental_duration)}
                            </p>
                        </div>
                    </div>

                    {/* Timestamp */}
                    <div className="text-right border-t border-border pt-2">
                        <p className="text-xs text-text-muted">
                            {formatDistanceToNow(new Date(application.submitted_at), {
                                addSuffix: true,
                            })}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    {canTakeAction && (
                        <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange("approved");
                                }}
                                disabled={isUpdatingStatus}
                                variant="primary"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 w-full"
                            >
                                <Icon icon={CheckCircle} size={16} className="mr-1" />
                                <span className="text-sm">Approve</span>
                            </Button>
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange("rejected");
                                }}
                                disabled={isUpdatingStatus}
                                variant="danger"
                                size="sm"
                                className="w-full"
                            >
                                <Icon icon={X} size={16} className="mr-1" />
                                <span className="text-sm">Reject</span>
                            </Button>
                        </div>
                    )}
                    {canUndoDecision && (
                        <div onClick={(e) => e.stopPropagation()}>
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange("under_review");
                                }}
                                disabled={isUpdatingStatus}
                                variant="secondary"
                                size="sm"
                                className="w-full"
                            >
                                <Icon icon={RotateCcw} size={16} className="mr-1" />
                                <span className="text-sm">{undoLabel}</span>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:flex">
                    {/* Left: Applicant Photo */}
                    <div className="shrink-0">
                        {application.applicant?.image_url ? (
                            <div className="relative w-32 h-32 md:w-48 md:h-48">
                                <Image
                                    src={application.applicant.image_url}
                                    alt={application.applicant.full_name || "Applicant"}
                                    fill
                                    className="object-cover"
                                    sizes="192px"
                                />
                            </div>
                        ) : (
                            <div className="w-32 h-32 md:w-48 md:h-48 bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500/20 flex items-center justify-center">
                                <Icon
                                    icon={User}
                                    size={48}
                                    className="md:w-16 md:h-16 text-primary-600 dark:text-primary-400"
                                />
                            </div>
                        )}
                    </div>

                    {/* Right: Application Details */}
                    <div className="flex-1 min-w-0 flex flex-col p-4">
                        {/* Two Column Layout */}
                        <div className="flex items-start justify-between gap-6 mb-2">
                            {/* Column 1: Applicant Details */}
                            <div className="flex-1 min-w-0 space-y-3">
                                {/* Row 1: Applicant Name, Email, Under Review Badge */}
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg md:text-xl font-bold text-text truncate">
                                            {application.applicant?.full_name || "N/A"}
                                        </h3>
                                        <div
                                            className={clsx(
                                                "px-3 rounded-full border",
                                                application.status === "approved"
                                                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                                    : application.status === "rejected"
                                                      ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                                      : application.status === "under_review"
                                                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                                        : "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700"
                                            )}
                                        >
                                            <span
                                                className={clsx(
                                                    "text-xs font-semibold capitalize",
                                                    application.status === "approved"
                                                        ? "text-green-700 dark:text-green-300"
                                                        : application.status === "rejected"
                                                          ? "text-red-700 dark:text-red-300"
                                                          : application.status === "under_review"
                                                            ? "text-blue-700 dark:text-blue-300"
                                                            : "text-gray-700 dark:text-gray-300"
                                                )}
                                            >
                                                {statusLabel}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-text-muted">
                                        {application.applicant?.email && (
                                            <a
                                                href={`mailto:${application.applicant.email}`}
                                                className="text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1 truncate"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Icon icon={Mail} size={16} className="shrink-0" />
                                                <span className="truncate">
                                                    {application.applicant.email}
                                                </span>
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Row 2: Application Details (Reference, Move-in, Duration) */}
                                <div className="flex items-center gap-4 md:gap-6 text-sm">
                                    <div className="min-w-0">
                                        <p className="text-xs text-text-subtle mb-0.5">Reference</p>
                                        <p className="font-mono text-sm font-medium text-text truncate">
                                            #{application.id.substring(0, 8).toUpperCase()}
                                        </p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-text-subtle mb-0.5">
                                            Move-in Date
                                        </p>
                                        <p className="text-sm font-medium text-text whitespace-nowrap">
                                            {formatDateShort(application.move_in_date)}
                                        </p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-text-subtle mb-0.5">Duration</p>
                                        <p className="text-sm font-medium text-text whitespace-nowrap">
                                            {formatRentalDuration(application.rental_duration)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: Unit Name, Rent, Proposed Rent */}
                            <div className="text-right shrink-0">
                                <h4 className="text-base font-semibold text-text truncate">{unit.name}</h4>
                                <p className="text-xl font-bold text-primary-600">
                                    ${application.total_rent}
                                    <span className="text-sm font-normal text-text-muted">
                                        /week
                                    </span>
                                </p>
                                {application.proposed_rent &&
                                    application.proposed_rent !== application.total_rent && (
                                        <div className="mt-0.5">
                                            <span className="text-xs text-text-subtle">
                                                Proposed:{" "}
                                            </span>
                                            <span className="text-lg font-semibold text-text">
                                                ${application.proposed_rent}
                                                <span className="text-sm font-normal text-text-muted">
                                                    /week
                                                </span>
                                            </span>
                                        </div>
                                    )}
                            </div>
                        </div>

                        {/* Bottom Row: Submitted Date (left) and Action Buttons (right) */}
                        <div className="flex items-end justify-between gap-4 pt-3 border-t border-border mt-auto">
                            {/* Left: Submitted Date */}
                            <div>
                                <p className="text-sm text-text-muted">
                                    {formatDistanceToNow(new Date(application.submitted_at), {
                                        addSuffix: true,
                                    })}
                                </p>
                            </div>

                            {/* Right: Action Buttons or Status */}
                            {canTakeAction && (
                                <div
                                    className="flex items-center gap-2"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStatusChange("approved");
                                        }}
                                        disabled={isUpdatingStatus}
                                        variant="primary"
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-400"
                                    >
                                        <Icon icon={CheckCircle} size={16} className="mr-1.5" />
                                        <span>Approve</span>
                                    </Button>
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStatusChange("rejected");
                                        }}
                                        disabled={isUpdatingStatus}
                                        variant="danger"
                                        size="sm"
                                    >
                                        <Icon icon={X} size={16} className="mr-1.5" />
                                        <span>Reject</span>
                                    </Button>
                                </div>
                            )}
                            {canUndoDecision && (
                                <div onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStatusChange("under_review");
                                        }}
                                        disabled={isUpdatingStatus}
                                        variant="secondary"
                                        size="sm"
                                    >
                                        <Icon icon={RotateCcw} size={16} className="mr-1.5" />
                                        <span>{undoLabel}</span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Application Details Modal */}
            <ApplicationDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                application={application}
            />
        </>
    );
}
