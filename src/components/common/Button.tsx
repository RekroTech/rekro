import React from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    pill?: boolean;
    fullWidth?: boolean;
    loading?: boolean;
    children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = "primary",
            size = "md",
            pill = false,
            fullWidth = false,
            loading = false,
            disabled,
            className = "",
            children,
            ...props
        },
        ref
    ) => {
        const baseClasses =
            "inline-flex items-center justify-center font-semibold transition-all duration-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed";

        const variantClasses: Record<ButtonVariant, string> = {
            primary:
                "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-[var(--shadow-soft)]",
            secondary:
                "bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700 shadow-[var(--shadow-soft)]",
            danger: "bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-600 shadow-[var(--shadow-soft)]",
            ghost: "bg-transparent text-text hover:bg-surface-muted active:bg-surface-muted",
            outline:
                "bg-transparent border-2 border-primary-500 text-primary-500 hover:bg-primary-50 active:bg-primary-100",
        };

        const sizeClasses: Record<ButtonSize, string> = {
            sm: "px-3 py-1.5 text-sm",
            md: "px-4 py-2.5 text-base",
            lg: "px-6 py-3.5 text-lg",
        };

        const radiusClass = pill ? "rounded-[var(--radius-pill)]" : "rounded-[var(--radius-input)]";
        const widthClass = fullWidth ? "w-full" : "";

        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${radiusClass} ${widthClass} ${className}`}
                {...props}
            >
                {loading && (
                    <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
