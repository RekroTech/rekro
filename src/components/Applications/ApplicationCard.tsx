"use client";

import { useState } from "react";
import { Icon, Dropdown } from "@/components/common";
import type { DropdownItem } from "@/components/common/Dropdown";
import { formatDateShort, formatDistanceToNow, formatRentalDuration } from "@/lib/utils";
import type { ApplicationWithDetails } from "./types";
import { getStatusColor, getStatusIcon, canWithdraw, downloadApplication } from "./utils";
import { ApplicationDetailsModal } from "./ApplicationDetailsModal";
import { useWithdrawApplication } from "@/lib/hooks";

export interface ApplicationCardProps {
    application: ApplicationWithDetails;
}

export function ApplicationCard({
    application,
}: ApplicationCardProps) {
    const { mutate: withdrawApplication } = useWithdrawApplication();
    const [isWithdrawingThis, setIsWithdrawingThis] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const unit = application.units;

    const handleWithdraw = (applicationId: string) => {
        if (
            confirm(
                "Are you sure you want to withdraw this application? This action cannot be undone."
            )
        ) {
            setIsWithdrawingThis(true);
            withdrawApplication(applicationId, {
                onSettled: () => {
                    setIsWithdrawingThis(false);
                },
            });
        }
    };

    const dropdownItems: DropdownItem[] = [
        {
            label: "View Application",
            icon: <Icon name="eye" className="w-4 h-4" />,
            onClick: () => setIsDetailsModalOpen(true),
        },
        {
            label: "Download PDF",
            icon: <Icon name="download" className="w-4 h-4" />,
            onClick: () => downloadApplication(application),
        },
        ...(canWithdraw(application.status)
            ? [
                  {
                      label: isWithdrawingThis ? "Withdrawing..." : "Withdraw Application",
                      icon: <Icon name="x" className="w-4 h-4" />,
                      onClick: () => handleWithdraw(application.id),
                      variant: "danger" as const,
                      disabled: isWithdrawingThis,
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-6">
                <div className="flex items-start sm:items-center gap-3 sm:gap-6 w-full sm:w-auto">
                    <div className="flex-1 sm:flex-shrink-0 sm:flex-initial text-center sm:text-left">
                        <p className="text-xs text-text-subtle mb-1">Reference</p>
                        <p className="text-xs sm:text-sm text-text font-mono font-medium">
                            #{application.id.substring(0, 8).toUpperCase()}
                        </p>
                    </div>
                    <div className="flex-1 sm:flex-shrink-0 sm:flex-initial text-center sm:text-left">
                        <p className="text-xs text-text-subtle mb-1">Move-in Date</p>
                        <p className="text-xs sm:text-sm text-text font-medium">
                            {formatDateShort(application.move_in_date)}
                        </p>
                    </div>
                    <div className="flex-1 sm:flex-shrink-0 sm:flex-initial text-center sm:text-left">
                        <p className="text-xs text-text-subtle mb-1">Duration</p>
                        <p className="text-xs sm:text-sm text-text font-medium">
                            {formatRentalDuration(application.rental_duration)}
                        </p>
                    </div>
                </div>

                {/* Timestamp */}
                <div className="text-right flex-shrink-0 sm:self-end">
                    <p className="text-[10px] sm:text-sm text-text-muted whitespace-nowrap">
                        {formatDistanceToNow(new Date(application.submitted_at), {
                            addSuffix: true,
                        })}
                    </p>
                </div>
            </div>

            {/* Application Details Modal */}
            <ApplicationDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                application={application}
            />
        </div>
    );
}

