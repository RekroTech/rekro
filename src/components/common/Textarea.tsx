import React from "react";
import { clsx } from "clsx";

export type TextareaSize = "sm" | "md" | "lg";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    size?: TextareaSize;
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        {
            size = "md",
            label,
            error,
            helperText,
            fullWidth = true,
            className,
            id,
            disabled,
            ...props
        },
        ref
    ) => {
        const generatedId = React.useId();
        const textareaId = id || generatedId;

        const baseClasses =
            "bg-card border border-border text-foreground placeholder:text-text-subtle outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation";

        const sizeClasses: Record<TextareaSize, string> = {
            sm: "px-3 py-2.5 text-xs sm:text-sm",
            md: "px-4 py-2.5 text-sm sm:text-base",
            lg: "px-5 py-3.5 text-base sm:text-lg",
        };

        const radiusClass = "rounded-lg";
        const errorClass = error
            ? "border-danger-500 focus:border-danger-600 hover:border-danger-400"
            : "focus:border-transparent hover:border-text-muted";
        const focusClass = error
            ? "focus:ring-2 focus:ring-danger-500"
            : "focus:ring-2 focus:ring-primary-500";

        return (
            <div className={clsx(fullWidth && "w-full")}>
                <div className="relative">
                    {label && (
                        <label
                            htmlFor={textareaId}
                            className="absolute left-3 px-1.5 bg-card text-xs font-medium text-text-subtle -translate-y-1/2"
                        >
                            {label}
                        </label>
                    )}
                    <textarea
                        ref={ref}
                        id={textareaId}
                        disabled={disabled}
                        aria-invalid={error ? "true" : "false"}
                        aria-describedby={
                            error
                                ? `${textareaId}-error`
                                : helperText
                                  ? `${textareaId}-helper`
                                  : undefined
                        }
                        className={clsx(
                            baseClasses,
                            sizeClasses[size],
                            radiusClass,
                            errorClass,
                            focusClass,
                            fullWidth && "w-full",
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && (
                    <p
                        id={`${textareaId}-error`}
                        className="mt-1.5 text-sm text-danger-500"
                        role="alert"
                    >
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p id={`${textareaId}-helper`} className="mt-1.5 text-sm text-text-muted">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Textarea.displayName = "Textarea";
