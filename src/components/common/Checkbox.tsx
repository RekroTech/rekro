import React from "react";

export type CheckboxSize = "sm" | "md" | "lg";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
    size?: CheckboxSize;
    label?: string;
    error?: string;
    helperText?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ size = "md", label, error, helperText, className = "", id, disabled, ...props }, ref) => {
        const generatedId = React.useId();
        const checkboxId = id || generatedId;

        const sizeClasses: Record<CheckboxSize, string> = {
            sm: "w-4 h-4",
            md: "w-5 h-5",
            lg: "w-6 h-6",
        };

        const labelSizeClasses: Record<CheckboxSize, string> = {
            sm: "text-sm",
            md: "text-base",
            lg: "text-lg",
        };

        return (
            <div className="flex flex-col">
                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input
                            ref={ref}
                            id={checkboxId}
                            type="checkbox"
                            disabled={disabled}
                            className={`${sizeClasses[size]} bg-input-bg border-2 border-input-border rounded text-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className}`}
                            {...props}
                        />
                    </div>
                    {label && (
                        <label
                            htmlFor={checkboxId}
                            className={`ml-2 ${labelSizeClasses[size]} font-medium text-text cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            {label}
                        </label>
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

Checkbox.displayName = "Checkbox";
