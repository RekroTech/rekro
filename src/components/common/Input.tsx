"use client";

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
            prefix,
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
            sm: "px-3 py-2.5 text-sm min-h-[36px]",
            md: "px-4 py-2.5 text-base min-h-[44px]",
            lg: "px-5 py-3.5 text-lg min-h-[48px]",
        };

        const radiusClass = "rounded-lg";

        const errorClass = error
            ? "border-danger-500 not-disabled:focus:border-danger-600 not-disabled:hover:border-danger-400"
            : "not-disabled:focus:border-transparent not-disabled:hover:border-text-muted";

        const focusClass = error
            ? "not-disabled:focus:ring-2 not-disabled:focus:ring-danger-500"
            : "not-disabled:focus:ring-2 not-disabled:focus:ring-primary-500";

        const isDateLike =
            props.type === "date" || props.type === "time" || props.type === "datetime-local";

        return (
            <div className={clsx(fullWidth && "w-full")}>
                <div className="relative">
                    {label && (
                        <label
                            htmlFor={inputId}
                            className="absolute left-3 px-1.5 bg-card text-xs font-medium text-text-subtle -translate-y-1/2 z-1 pointer-events-none"
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
                            prefix && "pl-8",
                            rightIcon && !isDateLike && "pr-20",
                            // Date/time inputs have an internal picker icon/button (esp. iOS Safari).
                            // Reserve space for it without clipping the native browser affordance.
                            isDateLike &&
                                "min-w-0 box-border pr-10 [&::-webkit-date-and-time-value]:overflow-hidden [&::-webkit-date-and-time-value]:text-ellipsis [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:dark:invert",
                            // Hide the native browser clear button on search inputs (we render our own)
                            props.type === "search" &&
                                "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
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
