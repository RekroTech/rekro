import React from "react";
import { Icon } from "@/components/common";
import { DefinitionList } from "./DefinitionList";
import { DefinitionItem } from "./DefinitionItem";
import type { Application } from "@/types/db";

interface TenancyDetailsSectionProps {
    application: Application | null | undefined;
    isLoading: boolean;
    isError: boolean;
}

export const TenancyDetailsSection = React.memo(({
    application,
    isLoading,
    isError,
}: TenancyDetailsSectionProps) => {
    const formattedMoveInDate = application?.move_in_date
        ? new Date(application.move_in_date).toLocaleDateString()
        : undefined;

    const formattedRentalDuration = application?.rental_duration
        ? `${application.rental_duration} months`
        : undefined;

    const formattedBaseRent = (() => {
        if (application?.proposed_rent === null || application?.proposed_rent === undefined) {
            return undefined;
        }

        return (
            <span className="whitespace-nowrap">
                ${Number(application.proposed_rent).toLocaleString()}{" "}
                <span className="text-text-muted text-xs font-normal">/ week</span>
            </span>
        );
    })();

    const selectedInclusions = (() => {
        if (!application?.inclusions || typeof application.inclusions !== "object") {
            return [] as Array<[string, { selected: boolean; price: number }]>;
        }

        return Object.entries(application.inclusions).filter(([, inclusion]) => inclusion.selected);
    })();

    const hasInclusions = selectedInclusions.length > 0;

    return (
        <div className="bg-card rounded-[var(--radius-card)] border border-border overflow-hidden">
            <div className="px-4 py-3 bg-surface-subtle border-b border-border">
                <h4 className="font-semibold text-text text-sm flex items-center">
                    <Icon name="calendar" className="w-4 h-4 mr-2 text-primary-600 dark:text-primary-400" />
                    Tenancy Summary
                </h4>
            </div>

            {isLoading && <LoadingState />}
            {!isLoading && isError && <ErrorState />}
            {!isLoading && !isError && !application && <NoDataState />}

            {!isLoading && !isError && application && (
                <div className="p-4">
                    <DefinitionList columns={2}>
                        <DefinitionItem
                            label="Move-in Date"
                            value={formattedMoveInDate}
                        />
                        <DefinitionItem
                            label="Tenancy Duration"
                            value={formattedRentalDuration}
                        />
                        {application.proposed_rent !== null && application.proposed_rent !== undefined && (
                            <DefinitionItem
                                label="Base Rent"
                                value={formattedBaseRent}
                            />
                        )}
                        {application.occupancy_type == "dual" && (
                            <DefinitionItem
                                label="Occupancy Type"
                                value={application.occupancy_type}
                                valueClassName="capitalize"
                            />
                        )}
                    </DefinitionList>

                    {/* Inclusions */}
                    {hasInclusions && (
                        <div className="pt-4 border-t border-border">
                            <span className="text-text-muted text-xs block mb-2">Inclusions</span>
                            <div className="grid grid-cols-1 gap-2">
                                {selectedInclusions.map(([type, inclusion]) => (
                                    <InclusionItem
                                        key={type}
                                        type={type}
                                        price={inclusion.price}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Total Rent */}
                    {application.total_rent !== null && application.total_rent !== undefined && (
                        <div className="pt-4 border-t border-border mt-4">
                            <div className="bg-gradient-to-br from-surface-subtle to-surface-muted border-2 border-primary-300 dark:border-primary-700 px-3 sm:px-4 py-3 sm:py-3.5 rounded-[var(--radius-card)]">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-text font-semibold text-sm">Total Rent</span>
                                    <span className="text-primary-700 dark:text-primary-300 font-bold text-lg sm:text-xl">
                                        ${Number(application.total_rent).toLocaleString()}
                                        <span className="text-text-muted text-xs font-normal ml-1">/ week</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Message to Rekro */}
                    {application.message && (
                        <div className="pt-4 border-t border-border mt-4">
                            <span className="text-text-muted text-xs block mb-2">Message to Rekro</span>
                            <div className="bg-panel px-3 py-2.5 rounded-[var(--radius-input)]">
                                <p className="text-text text-sm leading-relaxed">
                                    {application.message}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

TenancyDetailsSection.displayName = "TenancyDetailsSection";

const LoadingState = React.memo(() => (
    <div className="flex items-center justify-center py-8">
        <Icon name="spinner" className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-2 text-sm text-text-muted">Loading tenancy details...</span>
    </div>
));

LoadingState.displayName = "LoadingState";

const ErrorState = React.memo(() => (
    <div className="p-4">
        <div className="p-3 bg-danger-500/10 border border-danger-500/20 rounded-[var(--radius-input)]">
            <p className="text-sm text-danger-600 flex items-center gap-2">
                <Icon name="alert-circle" className="w-4 h-4" />
                Failed to load tenancy details. Please try again.
            </p>
        </div>
    </div>
));

ErrorState.displayName = "ErrorState";

const NoDataState = React.memo(() => (
    <div className="p-4">
        <div className="p-3 bg-warning-500/10 border border-warning-500/20 rounded-[var(--radius-input)]">
            <p className="text-sm text-warning-600 flex items-center gap-2">
                <Icon name="alert-circle" className="w-4 h-4" />
                Tenancy details aren&#39;t available yet. Please go back and save your application first.
            </p>
        </div>
    </div>
));

NoDataState.displayName = "NoDataState";

interface InclusionItemProps {
    type: string;
    price: number;
}

const InclusionItem = React.memo(({ type, price }: InclusionItemProps) => (
    <div className="flex items-center justify-between bg-surface-subtle px-3 py-2 rounded-[var(--radius-input)]">
        <span className="text-text text-sm font-medium capitalize flex items-center gap-2">
            <Icon name="check" className="w-3.5 h-3.5 text-primary-600" />
            {type.replace("_", " ")}
        </span>
        <span className="text-text-muted text-xs">
            {price > 0 ? `+$${price}/week` : "Included"}
        </span>
    </div>
));

InclusionItem.displayName = "InclusionItem";

