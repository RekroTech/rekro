import React from "react";
import { Icon } from "./Icon";
import { clsx } from "clsx";

export type BackButtonProps = Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "onClick" | "children" | "type"
> & {
    className?: string;
};

export const BackButton = React.forwardRef<HTMLButtonElement, BackButtonProps>(
    ({ className, ...props }, ref) => {
        const handleClick = () => {
            if (typeof window !== "undefined") {
                window.history.back();
            }
        };

        return (
            <button
                ref={ref}
                type="button"
                onClick={handleClick}
                aria-label={props["aria-label"] ?? "Back"}
                className={clsx(
                    "inline-flex items-center",
                    "rounded-md font-semibold text-sm sm:text-base",
                    "text-primary-600 hover:text-primary-700 active:text-primary-800",
                    "hover:bg-primary-50 active:bg-primary-100",
                    "focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                    "touch-manipulation select-none",
                    className
                )}
                {...props}
            >
                <Icon name="chevron-left" className="shrink-0 h-4 sm:h-5 w-4 sm:w-5" />
                <span>Back</span>
            </button>
        );
    }
);

BackButton.displayName = "BackButton";
