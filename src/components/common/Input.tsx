import React, { forwardRef, useId, useRef, useImperativeHandle } from "react";
import { clsx } from "clsx";

export type InputVariant = "default" | "auth";
export type InputSize = "sm" | "md" | "lg";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
    size?: InputSize;
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            size = "md",
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            fullWidth = true,
            className,
            id,
            disabled,
            ...props
        },
        ref
    ) => {
        const generatedId = useId();
        const inputId = id || generatedId;
        const inputRef = useRef<HTMLInputElement>(null);

        // Merge internal ref with forwarded ref
        useImperativeHandle(ref, () => inputRef.current!);

        const baseClasses =
            "bg-card border border-border text-foreground placeholder:text-text-subtle outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed";

        const sizeClasses: Record<InputSize, string> = {
            sm: "px-3 py-2.5 text-sm",
            md: "px-4 py-2.5 text-base",
            lg: "px-5 py-3.5 text-lg",
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
                            htmlFor={inputId}
                            className="absolute left-3 px-1.5 bg-card text-xs font-medium text-text-subtle z-10 -translate-y-1/2"
                        >
                            {label}
                        </label>
                    )}
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={inputRef}
                        id={inputId}
                        disabled={disabled}
                        aria-invalid={error ? "true" : "false"}
                        aria-describedby={
                            error
                                ? `${inputId}-error`
                                : helperText
                                  ? `${inputId}-helper`
                                  : undefined
                        }
                        className={clsx(
                            baseClasses,
                            sizeClasses[size],
                            radiusClass,
                            errorClass,
                            focusClass,
                            fullWidth && "w-full",
                            leftIcon && "pl-10",
                            rightIcon && "pr-10",
                            className
                        )}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p
                        id={`${inputId}-error`}
                        className="mt-1.5 text-sm text-danger-500"
                        role="alert"
                    >
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-text-muted">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";
