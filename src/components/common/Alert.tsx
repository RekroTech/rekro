import React from "react";
import { clsx } from "clsx";
import { Icon, IconName } from "./Icon";

export type AlertVariant = "success" | "error" | "warning" | "info";

export interface AlertProps {
    /** Alert variant determines the color scheme */
    variant: AlertVariant;
    /** Title of the alert (optional) */
    title?: string;
    /** Alert message content */
    message: string | React.ReactNode;
    /** Custom icon (if not provided, uses default for variant) */
    icon?: IconName;
    /** Additional CSS classes */
    className?: string;
}

const variantConfig: Record<AlertVariant, { icon: IconName; colorClasses: string }> = {
    success: {
        icon: "check",
        colorClasses:
            "bg-success-500/10 border-success-500/30 text-success-600 dark:text-success-500",
    },
    error: {
        icon: "x",
        colorClasses: "bg-danger-500/10 border-danger-500/30 text-danger-600 dark:text-danger-500",
    },
    warning: {
        icon: "info",
        colorClasses:
            "bg-warning-500/10 border-warning-500/30 text-warning-600 dark:text-warning-500",
    },
    info: {
        icon: "info",
        colorClasses:
            "bg-primary-500/10 border-primary-500/30 text-primary-600 dark:text-primary-400",
    },
};

export function Alert({ variant, title, message, icon, className }: AlertProps) {
    const config = variantConfig[variant];
    const displayIcon = icon || config.icon;

    return (
        <div className={clsx("rounded-[10px] border p-3 sm:p-4", config.colorClasses, className)}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <Icon name={displayIcon} className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                    {title && (
                        <p className="text-sm font-semibold mb-1">
                            {title}
                        </p>
                    )}
                    <div className="text-sm">
                        {typeof message === "string" ? <p>{message}</p> : message}
                    </div>
                </div>
            </div>
        </div>
    );
}

