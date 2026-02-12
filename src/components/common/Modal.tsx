"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/common/Icon";

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-backdrop/30 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="flex min-h-full items-center justify-center p-2 sm:p-4 pointer-events-none"
                style={{ position: "relative", zIndex: 10 }}
            >
                <div
                    ref={modalRef}
                    onClick={(e) => e.stopPropagation()}
                    className={`relative w-full ${sizeClasses[size]} transform rounded-lg bg-card shadow-xl transition-all max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] flex flex-col pointer-events-auto`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6 sm:py-4 flex-shrink-0">
                        <h3 className="text-base sm:text-lg font-semibold text-foreground">
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-text-muted hover:text-foreground transition-colors"
                        >
                            <Icon name="close" className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-2 py-2 sm:px-6 sm:py-4 overflow-y-auto flex-1">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
