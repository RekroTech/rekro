"use client";

import { ReactNode } from "react";
import { Icon } from "@/components/common";
import type { IconName } from "@/components/common";

interface ProfileSectionCardProps {
    title: string;
    description?: string;
    icon?: IconName;
    completed: boolean;
    completionPercentage: number;
    required?: boolean;
    isExpanded?: boolean;
    onToggle?: () => void;
    showCompletion?: boolean;
    children: ReactNode;
}

/**
 * Collapsible section card for profile sections
 */
export function ProfileSectionCard({
    title,
    description,
    icon = "document",
    completed,
    completionPercentage,
    required = false,
    isExpanded = true,
    onToggle,
    showCompletion = true,
    children,
}: ProfileSectionCardProps) {
    const statusColor = completed
        ? "text-green-600 dark:text-green-400"
        : completionPercentage >= 50
          ? "text-yellow-600 dark:text-yellow-400"
          : "text-gray-400 dark:text-gray-500";

    return (
        <div
            className={`rounded-xl border-2 overflow-hidden transition-all bg-surface-subtle dark:bg-surface border-border`}
        >
            {/* Section Header */}
            <button
                onClick={onToggle}
                className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-card dark:hover:bg-surface-muted/50 transition-colors"
                type="button"
            >
                <div className="flex items-center gap-4">
                    <div className={"p-2 rounded-lg bg-card dark:bg-surface-muted"}>
                        <Icon name={icon} className={`w-5 h-5 text-text-muted`} />
                    </div>

                    <div className="text-left">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-text">{title}</h3>
                            {required && (
                                <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                                    Required
                                </span>
                            )}
                        </div>
                        {description && (
                            <p className="text-sm text-text-muted mt-0.5">{description}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Completion Badge */}
                    {showCompletion && (
                        <div className="flex items-center gap-2">
                            {completed ? (
                                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                    <Icon name="check-circle" className="w-5 h-5" />
                                    <span className="text-sm font-medium">Complete</span>
                                </div>
                            ) : (
                                <div className={`flex items-center gap-1 ${statusColor}`}>
                                    <span className="text-sm font-medium">{completionPercentage}%</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Expand/Collapse Icon */}
                    <Icon
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        className="w-5 h-5 text-text-muted"
                    />
                </div>
            </button>

            {/* Section Content */}
            {isExpanded && (
                <div className="px-4 sm:px-6 py-4 bg-card dark:bg-surface border-t border-border">{children}</div>
            )}
        </div>
    );
}
