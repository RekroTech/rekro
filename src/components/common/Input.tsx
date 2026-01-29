import React from "react";

export type InputVariant = "default" | "auth";
export type InputSize = "sm" | "md" | "lg";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
    variant?: InputVariant;
    size?: InputSize;
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            variant = "default",
            size = "md",
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            fullWidth = true,
            className = "",
            id,
            disabled,
            ...props
        },
        ref
    ) => {
        const generatedId = React.useId();
        const inputId = id || generatedId;

        const baseClasses =
            "bg-input-bg border border-input-border text-text placeholder:text-text-subtle outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

        const sizeClasses: Record<InputSize, string> = {
            sm: "px-3 py-2 text-sm",
            md: "px-4 py-2.5 text-base",
            lg: "px-5 py-3.5 text-lg",
        };

        const radiusClass =
            variant === "auth"
                ? "rounded-[var(--radius-input-rn)]"
                : "rounded-[var(--radius-input)]";
        const widthClass = fullWidth ? "w-full" : "";
        const errorClass = error
            ? "border-danger-500 focus:border-danger-600"
            : "focus:border-primary-500";
        const focusClass = error
            ? "focus:shadow-[0_0_0_4px_rgba(255,59,48,0.1)]"
            : "focus:shadow-[0_0_0_4px_var(--primary-100)]";
        const iconPaddingLeft = leftIcon ? "pl-10" : "";
        const iconPaddingRight = rightIcon ? "pr-10" : "";

        return (
            <div className={fullWidth ? "w-full" : ""}>
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-medium text-text mb-2">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        disabled={disabled}
                        className={`${baseClasses} ${sizeClasses[size]} ${radiusClass} ${widthClass} ${errorClass} ${focusClass} ${iconPaddingLeft} ${iconPaddingRight} ${className}`}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && <p className="mt-1.5 text-sm text-danger-500">{error}</p>}
                {helperText && !error && (
                    <p className="mt-1.5 text-sm text-text-muted">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";
