import React from "react";
import { Icon } from "./Icon";

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

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    (
        {
            size = "md",
            label,
            error,
            helperText,
            options,
            placeholder,
            fullWidth = true,
            className = "",
            id,
            disabled,
            ...props
        },
        ref
    ) => {
        const generatedId = React.useId();
        const selectId = id || generatedId;

        const baseClasses =
            "bg-input-bg border border-input-border text-text outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer";

        const sizeClasses: Record<SelectSize, string> = {
            sm: "px-3 py-2 pr-8 text-sm",
            md: "px-4 py-2.5 pr-10 text-base",
            lg: "px-5 py-3.5 pr-12 text-lg",
        };

        const radiusClass = "rounded-[var(--radius-input)]";
        const widthClass = fullWidth ? "w-full" : "";
        const errorClass = error
            ? "border-danger-500 focus:border-danger-600"
            : "focus:border-primary-500";
        const focusClass = error
            ? "focus:shadow-[0_0_0_4px_rgba(255,59,48,0.1)]"
            : "focus:shadow-[0_0_0_4px_var(--primary-100)]";

        return (
            <div className={fullWidth ? "w-full" : ""}>
                {label && (
                    <label htmlFor={selectId} className="block text-sm font-medium text-text mb-2">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        id={selectId}
                        disabled={disabled}
                        className={`${baseClasses} ${sizeClasses[size]} ${radiusClass} ${widthClass} ${errorClass} ${focusClass} ${className}`}
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
                        <Icon name="chevron-down" className="w-5 h-5" />
                    </div>
                </div>
                {error && <p className="mt-1.5 text-sm text-danger-500">{error}</p>}
                {helperText && !error && (
                    <p className="mt-1.5 text-sm text-text-muted">{helperText}</p>
                )}
            </div>
        );
    }
);

Select.displayName = "Select";
