"use client";

import React, { useEffect, useRef } from "react";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";

export interface ModalButton {
    /** Button label */
    label: string;
    /** Button click handler */
    onClick: () => void | Promise<void>;
    /** Button variant */
    variant?: "primary" | "secondary" | "danger";
    /** Whether button is disabled */
    disabled?: boolean;
    /** Whether button is in loading state */
    isLoading?: boolean;
    /** Icon to show on button */
    icon?: "chevron-left" | "chevron-right" | "check" | "close" | "spinner";
    /** Icon position */
    iconPosition?: "left" | "right";
}

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
    /** Primary button (right side) - typically "Next", "Submit", "Save", etc. */
    primaryButton?: ModalButton;
    /** Secondary button (left side) - typically "Back", "Cancel", etc. */
    secondaryButton?: ModalButton;
    /** Description text below buttons */
    actionsDescription?: string;
    /** Whether buttons should take equal 50% width each */
    fullWidthButtons?: boolean;
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = "md",
    primaryButton,
    secondaryButton,
    actionsDescription,
    fullWidthButtons = false,
}: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const previouslyFocusedElement = useRef<HTMLElement | null>(null);

    // Store previously focused element and restore on close
    useEffect(() => {
        if (isOpen) {
            // Store the currently focused element before modal takes focus
            const activeEl = document.activeElement as HTMLElement;
            // Only store if it's a focusable element (not body)
            if (activeEl && activeEl !== document.body) {
                previouslyFocusedElement.current = activeEl;
            }
        } else if (previouslyFocusedElement.current) {
            // Delay to ensure modal is fully closed before restoring focus
            const timer = setTimeout(() => {
                const elementToFocus = previouslyFocusedElement.current;
                if (elementToFocus && typeof elementToFocus.focus === 'function') {
                    try {
                        elementToFocus.focus();
                    } catch (e) {
                        // Element might not be focusable anymore, ignore error
                        console.warn('Failed to restore focus:', e);
                    }
                }
                previouslyFocusedElement.current = null;
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Implement focus trap
    useEffect(() => {
        if (!isOpen || !modalRef.current) return;

        const modal = modalRef.current;
        const focusableElements = modal.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTab = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        modal.addEventListener('keydown', handleTab);

        // Focus first element when modal opens
        setTimeout(() => {
            firstElement?.focus();
        }, 100);

        return () => {
            modal.removeEventListener('keydown', handleTab);
        };
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            // Prevent body scroll and handle mobile viewport
            document.body.style.overflow = "hidden";
            document.body.style.position = "fixed";
            document.body.style.width = "100%";
            document.body.style.height = "100%";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
            document.body.style.position = "";
            document.body.style.width = "";
            document.body.style.height = "";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
    };

    const hasActions = primaryButton || secondaryButton;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-backdrop/30 backdrop-blur-sm transition-opacity"
            />

            {/* Modal Container - handles scrolling */}
            <div className="fixed inset-0 overflow-y-auto overflow-x-hidden overscroll-contain" onClick={onClose}>
                <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
                    <div
                        ref={modalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={title ? "modal-title" : undefined}
                        onClick={(e) => e.stopPropagation()}
                        className={`relative w-full ${sizeClasses[size]} transform rounded-lg bg-card shadow-xl transition-all my-4 sm:my-8 flex flex-col max-h-[90vh] sm:max-h-[85vh]`}
                    >
                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6 sm:py-4 flex-shrink-0">
                                <h3 id="modal-title" className="text-base sm:text-lg font-semibold text-foreground">
                                    {title}
                                </h3>
                                <button
                                    onClick={onClose}
                                    aria-label="Close dialog"
                                    className="text-text-muted hover:text-foreground transition-colors"
                                >
                                    <Icon name="close" className="h-5 w-5 sm:h-6 sm:w-6" />
                                </button>
                            </div>
                        )}

                        {/* Content */}
                        <div className="p-4 sm:px-6 sm:py-4 overflow-y-auto flex-1">
                            {children}
                        </div>

                        {/* Sticky Actions Footer */}
                        {hasActions && (
                            <div className="flex-shrink-0 border-t border-border bg-card/95 backdrop-blur-sm px-4 py-3 sm:px-6 sm:py-4">
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-3">
                                        {secondaryButton && (
                                            <ModalButton
                                                button={secondaryButton}
                                                className={fullWidthButtons ? "flex-1" : "flex-1 sm:flex-initial sm:min-w-[140px]"}
                                            />
                                        )}
                                        {primaryButton && (
                                            <ModalButton
                                                button={primaryButton}
                                                className={fullWidthButtons ? "flex-1" : "flex-1 sm:flex-initial sm:min-w-[160px]"}
                                            />
                                        )}
                                    </div>
                                    {actionsDescription && (
                                        <p className="text-xs text-text-muted text-center sm:text-right">
                                            {actionsDescription}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Render a single modal button
 */
interface ModalButtonProps {
    button: ModalButton;
    className?: string;
}

function ModalButton({ button, className }: ModalButtonProps) {
    const {
        label,
        onClick,
        variant = "secondary",
        disabled = false,
        isLoading = false,
        icon,
        iconPosition = "right",
    } = button;

    const handleClick = async () => {
        await onClick();
    };

    const renderIcon = () => {
        if (!icon) return null;

        const iconName = isLoading ? "spinner" : icon;
        const iconClass = `w-4 h-4 ${isLoading ? "animate-spin" : ""}`;

        return <Icon name={iconName} className={iconClass} />;
    };

    return (
        <Button
            type="button"
            variant={variant}
            onClick={handleClick}
            disabled={disabled || isLoading}
            className={className}
        >
            {icon && iconPosition === "left" ? (
                <>
                    {renderIcon()}
                    <span className="ml-2">{label}</span>
                </>
            ) : icon && iconPosition === "right" ? (
                <>
                    <span>{label}</span>
                    <span className="ml-2">{renderIcon()}</span>
                </>
            ) : (
                label
            )}
        </Button>
    );
}

