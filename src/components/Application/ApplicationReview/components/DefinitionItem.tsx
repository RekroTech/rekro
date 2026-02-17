import React from "react";
import { clsx } from "clsx";

interface DefinitionItemProps {
    label: React.ReactNode;
    value?: React.ReactNode;
    fullWidth?: boolean;
    valueClassName?: string;
}

export const DefinitionItem = React.memo(({
    label,
    value,
    fullWidth,
    valueClassName,
}: DefinitionItemProps) => {
    return (
        <div
            className={clsx(
                "group flex flex-col gap-1.5 py-3 border-b border-border/40 last:border-b-0",
                "sm:py-3.5",
                fullWidth && "sm:col-span-2 lg:col-span-3",
            )}
        >
            <dt className={clsx(
                "text-text-muted text-[11px] font-semibold tracking-wider uppercase",
                "sm:text-xs"
            )}>
                {label}
            </dt>
            <dd
                className={clsx(
                    "text-text text-base font-normal leading-relaxed",
                    "min-w-0 break-words",
                    "sm:text-[15px]",
                    valueClassName,
                )}
            >
                {value ?? <span className="text-text-subtle italic">Not specified</span>}
            </dd>
        </div>
    );
});

DefinitionItem.displayName = "DefinitionItem";

