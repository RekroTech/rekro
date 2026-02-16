"use client";

import { useEffect, useState } from "react";
import { Icon, type IconName } from "./Icon";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
}

const toastConfig: Record<
    ToastType,
    { icon: IconName; iconColor: string; borderColor: string }
> = {
    success: {
        icon: "check-circle",
        iconColor: "text-primary-500",
        borderColor: "border-primary-200",
    },
    error: {
        icon: "alert-circle",
        iconColor: "text-[var(--danger-500)]",
        borderColor: "border-[var(--danger-500)]/20",
    },
    info: {
        icon: "info-circle",
        iconColor: "text-secondary-500",
        borderColor: "border-secondary-200",
    },
    warning: {
        icon: "alert-circle",
        iconColor: "text-[var(--warning-500)]",
        borderColor: "border-[var(--warning-500)]/20",
    },
};

export function Toast({ message, type = "success", duration = 3000, onClose }: ToastProps) {
    const config = toastConfig[type];
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(onClose, 200); // Wait for slide-out animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 200);
    };

    return (
        <div
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-card border shadow-[var(--shadow-lift)] ${
                isExiting ? "animate-toast-out" : "animate-toast-in"
            } ${config.borderColor}`}
            style={{ borderRadius: "var(--radius-input)" }}
            role="alert"
        >
            <Icon name={config.icon} className={`w-5 h-5 flex-shrink-0 ${config.iconColor}`} />
            <p className="text-sm font-medium text-foreground">{message}</p>
            <button
                onClick={handleClose}
                className="ml-2 text-text-muted hover:text-foreground transition-colors flex-shrink-0"
                aria-label="Close notification"
            >
                <Icon name="x" className="w-4 h-4" />
            </button>
        </div>
    );
}

