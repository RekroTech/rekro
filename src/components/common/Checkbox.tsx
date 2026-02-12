import React from "react";
import { clsx } from "clsx";

export type CheckboxSize = "sm" | "md" | "lg";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
    size?: CheckboxSize;
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    (
        {
            size = "md",
            label,
            error,
            helperText,
            fullWidth = false,
            className,
            id,
            disabled,
            ...props
        },
        ref
    ) => {
        const generatedId = React.useId();
        const checkboxId = id || generatedId;

        const baseClasses =
            "border border-border rounded transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none";

        const sizeClasses: Record<CheckboxSize, string> = {
            sm: "w-4 h-4",
            md: "w-5 h-5",
            lg: "w-6 h-6",
        };

        const labelSizeClasses: Record<CheckboxSize, string> = {
            sm: "text-sm",
            md: "text-sm",
            lg: "text-base",
        };

        const errorClass = error
            ? "border-danger-500 hover:border-danger-600"
            : "hover:border-text-muted";

        const accentColorStyle = error
            ? { accentColor: "var(--danger-500)" }
            : { accentColor: "var(--primary-500)" };

        return (
            <div className={clsx("flex flex-col", fullWidth && "w-full")}>
                <label
                    htmlFor={checkboxId}
                    className={clsx(
                        "flex items-start gap-3 cursor-pointer",
                        disabled && "cursor-not-allowed"
                    )}
                >
                    <input
                        ref={ref}
                        id={checkboxId}
                        type="checkbox"
                        disabled={disabled}
                        aria-invalid={error ? "true" : "false"}
                        aria-describedby={
                            error
                                ? `${checkboxId}-error`
                                : helperText
                                  ? `${checkboxId}-helper`
                                  : undefined
                        }
                        style={accentColorStyle}
                        className={clsx(
                            baseClasses,
                            sizeClasses[size],
                            errorClass,
                            "flex-shrink-0",
                            className
                        )}
                        {...props}
                    />
                    {label && (
                        <span
                            className={clsx(
                                "font-normal text-foreground select-none touch-manipulation leading-relaxed",
                                labelSizeClasses[size],
                                disabled && "opacity-50"
                            )}
                        >
                            {label}
                        </span>
                    )}
                </label>
                {error && (
                    <p id={`${checkboxId}-error`} className="mt-1.5 text-sm text-danger-500">
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p id={`${checkboxId}-helper`} className="mt-1.5 text-sm text-text-muted">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Checkbox.displayName = "Checkbox";
