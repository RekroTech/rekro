"use client";

import React from "react";
import { clsx } from "clsx";
import { Icon } from "@/components/common";

interface InclusionCardProps {
    title: string;
    description?: string;
    price: React.ReactNode;
    selected: boolean;
    onToggle: () => void;
    disabled?: boolean;
    /** Optional right-side content (e.g. a pill like "Optional"). */
    meta?: React.ReactNode;
    /** Optional extra content rendered under the main row (e.g. furniture payment options). */
    children?: React.ReactNode;
}

export function InclusionCard({
    title,
    description,
    price,
    selected,
    onToggle,
    disabled,
    meta,
    children,
}: InclusionCardProps) {
    return (
        <button
            type="button"
            onClick={() => {
                if (disabled) return;
                onToggle();
            }}
            disabled={disabled}
            aria-pressed={selected}
            className={clsx(
                "w-full text-left rounded-lg border p-3 transition-colors",
                disabled
                    ? "cursor-not-allowed opacity-80 bg-gray-50 border-gray-200"
                    : selected
                      ? "bg-primary-50 border-primary-300"
                      : "bg-white border-gray-200 hover:border-gray-300"
            )}
        >
            <div className="flex items-start gap-3">
                <span
                    className={clsx(
                        "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border",
                        selected
                            ? "bg-primary-600 border-primary-600 text-white"
                            : "bg-white border-gray-300 text-transparent"
                    )}
                    aria-hidden="true"
                >
                    <Icon name="check" className="h-4 w-4" />
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-sm font-medium text-text truncate">{title}</div>
                            {description ? (
                                <div className="mt-0.5 text-xs text-text-muted">{description}</div>
                            ) : null}
                        </div>

                        <div className="shrink-0 text-right">
                            {meta ? <div className="text-xs text-text-muted">{meta}</div> : null}
                            <div className="text-sm font-semibold text-text">{price}</div>
                        </div>
                    </div>

                    {children ? (
                        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                            {children}
                        </div>
                    ) : null}
                </div>
            </div>
        </button>
    );
}
