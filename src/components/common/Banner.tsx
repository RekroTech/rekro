import { clsx } from "clsx";
import { Icon } from "./Icon";

export type BannerVariant = "success" | "error" | "warning" | "info";

export interface BannerProps {
    /** Banner variant determines the color scheme */
    variant: BannerVariant;
    /** Title of the banner */
    title: string;
    /** Banner message content */
    message: string;
    /** Callback when banner is dismissed (if provided, shows close button) */
    onDismiss?: () => void;
    /** Additional CSS classes */
    className?: string;
}

const variantConfig: Record<BannerVariant, { iconBg: string; borderColor: string; textColor: string }> = {
    success: {
        iconBg: "bg-success-500/20",
        borderColor: "border-success-500/30",
        textColor: "text-success-700 dark:text-success-400",
    },
    error: {
        iconBg: "bg-danger-500/20",
        borderColor: "border-danger-500/30",
        textColor: "text-danger-700 dark:text-danger-400",
    },
    warning: {
        iconBg: "bg-warning-500/20",
        borderColor: "border-warning-500/30",
        textColor: "text-warning-700 dark:text-warning-400",
    },
    info: {
        iconBg: "bg-primary-500/20",
        borderColor: "border-primary-500/30",
        textColor: "text-primary-700 dark:text-primary-400",
    },
};

export function Banner({ variant, title, message, onDismiss, className }: BannerProps) {
    const config = variantConfig[variant];

    return (
        <div
            className={clsx(
                "rounded-lg border bg-opacity-10 p-4",
                config.borderColor,
                `bg-${variant}-500/10`,
                className
            )}
        >
            <div className="flex items-center gap-3">
                <div
                    className={clsx(
                        "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                        config.iconBg
                    )}
                >
                    <Icon
                        name={variant === "success" ? "check" : "info"}
                        className={clsx("h-5 w-5", config.textColor)}
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={clsx("text-sm font-semibold", config.textColor)}>{title}</h3>
                    <p className={clsx("text-sm", config.textColor)}>{message}</p>
                </div>
                {onDismiss && (
                    <button
                        type="button"
                        onClick={onDismiss}
                        className={clsx(
                            "flex-shrink-0 text-text-muted hover:text-foreground transition-colors",
                            config.textColor
                        )}
                        aria-label="Dismiss"
                    >
                        <Icon name="close" className="h-5 w-5" />
                    </button>
                )}
            </div>
        </div>
    );
}

