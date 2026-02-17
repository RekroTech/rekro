"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Toast, type ToastType } from "@/components/common";

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    showSuccess: (message: string, duration?: number) => void;
    showError: (message: string, duration?: number) => void;
    showInfo: (message: string, duration?: number) => void;
    showWarning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback(
        (message: string, type: ToastType = "success", duration: number = 3000) => {
            const id = `toast-${Date.now()}-${Math.random()}`;
            const newToast: ToastMessage = { id, message, type, duration };

            setToasts((prev) => [...prev, newToast]);
        },
        []
    );

    const showSuccess = useCallback(
        (message: string, duration?: number) => {
            showToast(message, "success", duration);
        },
        [showToast]
    );

    const showError = useCallback(
        (message: string, duration?: number) => {
            showToast(message, "error", duration);
        },
        [showToast]
    );

    const showInfo = useCallback(
        (message: string, duration?: number) => {
            showToast(message, "info", duration);
        },
        [showToast]
    );

    const showWarning = useCallback(
        (message: string, duration?: number) => {
            showToast(message, "warning", duration);
        },
        [showToast]
    );

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider
            value={{ showToast, showSuccess, showError, showInfo, showWarning }}
        >
            {children}
            {/* Render all active toasts */}
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full px-4 flex flex-col gap-2 pointer-events-none sm:w-auto sm:px-0">
                {toasts.map((toast, index) => (
                    <div
                        key={toast.id}
                        className="pointer-events-auto"
                        style={{
                            // Stack toasts with slight offset for visibility
                            transform: `translateY(${index * 4}px)`,
                            opacity: 1 - index * 0.1,
                        }}
                    >
                        <Toast
                            message={toast.message}
                            type={toast.type}
                            duration={toast.duration}
                            onClose={() => removeToast(toast.id)}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

