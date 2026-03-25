import React, { forwardRef, useId } from "react";
import { clsx } from "clsx";
import { Icon } from "./Icon";
import { ChevronDown } from "lucide-react";

export type SelectSize = "sm" | "md" | "lg";

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
    size?: SelectSize;
    label?: string;
    error?: string;
    helperText?: string;
    options: SelectOption[];
    placeholder?: string;
    fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    (
        {
            size = "md",
            label,
            error,
            helperText,
            options,
            placeholder,
            fullWidth = true,
            className,
            id,
            disabled,
            ...props
        },
        ref
    ) => {
        const generatedId = useId();
        const selectId = id || generatedId;

        const sizeClasses: Record<SelectSize, string> = {
            sm: "px-3 py-2.5 pr-8 text-sm",
            md: "px-4 py-2.5 pr-10 text-base",
            lg: "px-5 py-3.5 pr-12 text-lg",
        };

        return (
            <div className={clsx(fullWidth && "w-full")}>
                <div className="relative">
                    {label && (
                        <label
                            htmlFor={selectId}
                            className="absolute left-3 px-1.5 bg-card text-xs font-medium text-text-subtle -translate-y-1/2 z-1 pointer-events-none"
                        >
                            {label}
                        </label>
                    )}
                    <select
                        ref={ref}
                        id={selectId}
                        disabled={disabled}
                        aria-invalid={error ? "true" : "false"}
                        aria-describedby={
                            error
                                ? `${selectId}-error`
                                : helperText
                                  ? `${selectId}-helper`
                                  : undefined
                        }
                        className={clsx(
                            "bg-card border border-border text-foreground outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer",
                            "rounded-lg",
                            sizeClasses[size],
                            fullWidth && "w-full",
                            error
                                ? "border-danger-500 not-disabled:focus:border-danger-600 not-disabled:hover:border-danger-400 not-disabled:focus:ring-2 not-disabled:focus:ring-danger-500"
                                : "not-disabled:focus:border-transparent not-disabled:hover:border-text-muted not-disabled:focus:ring-2 not-disabled:focus:ring-primary-500",
                            className
                        )}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                        <Icon icon={ChevronDown} size={20} />
                    </div>
                </div>
                {error && (
                    <p
                        id={`${selectId}-error`}
                        className="mt-1.5 text-sm text-danger-500"
                        role="alert"
                    >
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p id={`${selectId}-helper`} className="mt-1.5 text-sm text-text-muted">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Select.displayName = "Select";
