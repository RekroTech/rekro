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
            "bg-card border border-border text-foreground outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer";

        const sizeClasses: Record<SelectSize, string> = {
            sm: "px-3 py-2.5 pr-8 text-sm",
            md: "px-4 py-2.5 pr-10 text-base",
            lg: "px-5 py-3.5 pr-12 text-lg",
        };

        const radiusClass = "rounded-lg";
        const widthClass = fullWidth ? "w-full" : "";
        const errorClass = error
            ? "border-danger-500 focus:border-danger-600 hover:border-danger-400"
            : "focus:border-transparent hover:border-text-muted";
        const focusClass = error
            ? "focus:ring-2 focus:ring-danger-500"
            : "focus:ring-2 focus:ring-primary-500";

        return (
            <div className={fullWidth ? "w-full" : ""}>
                <div className="relative">
                    {label && (
                        <label
                            htmlFor={selectId}
                            className="absolute left-3 px-1.5 bg-card text-xs font-medium text-text-subtle -translate-y-1/2"
                        >
                            {label}
                        </label>
                    )}
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
