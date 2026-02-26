import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { Icon } from "./Icon";

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

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = "primary",
            size = "md",
            pill = false,
            fullWidth = false,
            loading = false,
            disabled,
            className,
            children,
            type = "button",
            ...props
        },
        ref
    ) => {
        const baseClasses =
            "inline-flex items-center justify-center font-semibold transition-all duration-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation";

        const variantClasses: Record<ButtonVariant, string> = {
            primary:
                "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-[var(--shadow-soft)] focus:shadow-[0_0_0_4px_var(--focus-ring)]",
            secondary:
                "bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700 shadow-[var(--shadow-soft)] focus:shadow-[0_0_0_4px_rgba(58,74,107,0.15)]",
            danger: "bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 shadow-[var(--shadow-soft)] focus:shadow-[0_0_0_4px_rgba(220,38,38,0.12)]",
            ghost: "bg-transparent text-text hover:bg-surface-muted active:bg-surface-muted focus:shadow-[0_0_0_4px_var(--focus-ring)]",
            outline:
                "bg-transparent border-2 border-primary-500 text-primary-500 hover:bg-surface-subtle active:bg-surface-muted focus:shadow-[0_0_0_4px_var(--focus-ring)]",
        };

        const sizeClasses: Record<ButtonSize, string> = {
            sm: "px-3 py-2 text-sm min-h-[36px]",
            md: "px-4 py-2.5 text-base min-h-[44px]",
            lg: "px-5 py-3.5 text-lg min-h-[48px]",
        };

        const radiusClass = pill ? "rounded-full" : "rounded-lg";

        return (
            <button
                ref={ref}
                type={type}
                disabled={disabled || loading}
                className={clsx(
                    baseClasses,
                    variantClasses[variant],
                    sizeClasses[size],
                    radiusClass,
                    fullWidth && "w-full",
                    className
                )}
                {...props}
            >
                {loading && <Icon name="spinner" className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
