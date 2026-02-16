"use client";

import React from "react";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

export type SegmentedControlSize = "sm" | "md";

export interface SegmentedControlOption<T extends string | number | boolean> {
    value: T;
    label: React.ReactNode;
    iconName?: IconName;
    disabled?: boolean;
    ariaLabel?: string;
}

export interface SegmentedControlProps<T extends string | number | boolean> {
    /** Options to display. Order is preserved. */
    options: Array<SegmentedControlOption<T>>;
    /** Controlled selected value. Use null for "no selection". */
    value: T | null;
    /** Called when user selects an option. */
    onChange: (value: T) => void;
    /** Optional group label for screen readers. */
    ariaLabel?: string;
    /** Disables all options. */
    disabled?: boolean;
    /** Visual size. */
    size?: SegmentedControlSize;
    className?: string;
}

export function SegmentedControl<T extends string | number | boolean>({
    options,
    value,
    onChange,
    ariaLabel,
    disabled = false,
    size = "md",
    className = "",
}: SegmentedControlProps<T>) {
    const basePadding = size === "sm" ? "px-3 py-2 text-sm" : "px-3 py-2 text-sm";

    return (
        <div className={className} role="group" aria-label={ariaLabel}>
            <div className="flex gap-2">
                {options.map((opt) => {
                    const pressed = value === opt.value;
                    const isDisabled = disabled || opt.disabled;

                    return (
                        <button
                            key={String(opt.value)}
                            type="button"
                            onClick={() => onChange(opt.value)}
                            aria-pressed={pressed}
                            aria-label={opt.ariaLabel}
                            disabled={isDisabled}
                            className={`flex-1 rounded-md border transition-all ${basePadding} ${
                                pressed
                                    ? "bg-primary-600 text-white border-primary-600 font-medium"
                                    : "bg-card text-text border-border hover:border-primary-400"
                            } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <span className="inline-flex items-center justify-center gap-2">
                                {opt.iconName ? (
                                    <Icon name={opt.iconName} className="w-4 h-4" />
                                ) : null}
                                {opt.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

