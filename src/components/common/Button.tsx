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
            "inline-flex items-center justify-center font-semibold transition-all duration-200 outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

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
