"use client";

import React, { useState } from "react";
import { clsx } from "clsx";

export type TooltipPosition = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
    /** The content to display inside the tooltip */
    content: React.ReactNode;
    /** The element that triggers the tooltip */
    children: React.ReactNode;
    /** Position of the tooltip relative to the trigger */
    position?: TooltipPosition;
    /** Max width of the tooltip bubble */
    maxWidth?: string;
    /** Additional CSS classes for the wrapper */
    className?: string;
}

const positionClasses: Record<TooltipPosition, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const arrowClasses: Record<TooltipPosition, string> = {
    top: "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-[var(--color-tooltip-bg,#1e293b)]",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-[var(--color-tooltip-bg,#1e293b)]",
    left: "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-[var(--color-tooltip-bg,#1e293b)]",
    right: "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-[var(--color-tooltip-bg,#1e293b)]",
};

export function Tooltip({
    content,
    children,
    position = "top",
    maxWidth = "max-w-xs",
    className,
}: TooltipProps) {
    const [visible, setVisible] = useState(false);

    return (
        <span
            className={clsx("relative inline-flex items-center", className)}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            onFocus={() => setVisible(true)}
            onBlur={() => setVisible(false)}
        >
            {children}

            {visible && (
                <span
                    role="tooltip"
                    className={clsx(
                        "absolute z-50 pointer-events-none",
                        "px-3 py-2 rounded-lg shadow-lg",
                        "bg-slate-800 dark:bg-slate-700 text-white text-xs leading-relaxed",
                        "w-max",
                        maxWidth,
                        positionClasses[position]
                    )}
                >
                    {content}
                    {/* Arrow */}
                    <span
                        className={clsx(
                            "absolute w-0 h-0 border-4",
                            arrowClasses[position]
                        )}
                    />
                </span>
            )}
        </span>
    );
}

