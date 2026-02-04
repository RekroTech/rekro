import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        { label, error, helperText, fullWidth = true, className = "", id, disabled, ...props },
        ref
    ) => {
        const generatedId = React.useId();
        const textareaId = id || generatedId;

        const baseClasses =
            "bg-input-bg border border-input-border text-text placeholder:text-text-subtle outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

        const sizeClasses = "px-4 py-2.5 text-base";

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
                    <label
                        htmlFor={textareaId}
                        className="block text-sm font-medium text-text mb-2"
                    >
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textareaId}
                    disabled={disabled}
                    className={`${baseClasses} ${sizeClasses} ${radiusClass} ${widthClass} ${errorClass} ${focusClass} ${className}`}
                    {...props}
                />
                {error && <p className="mt-1.5 text-sm text-danger-500">{error}</p>}
                {helperText && !error && (
                    <p className="mt-1.5 text-sm text-text-muted">{helperText}</p>
                )}
            </div>
        );
    }
);

Textarea.displayName = "Textarea";
