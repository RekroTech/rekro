"use client";

import React, { useState, useRef, useEffect } from "react";

export interface DropdownItem {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: "default" | "danger";
    disabled?: boolean;
}

export interface DropdownProps {
    trigger: React.ReactNode;
    items: DropdownItem[];
    align?: "left" | "right";
}

export function Dropdown({ trigger, items, align = "right" }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const alignmentClass = align === "right" ? "right-0" : "left-0";

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center focus:outline-none transition-all duration-200 hover:opacity-80 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-[var(--radius-input)]"
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                {trigger}
            </button>

            {isOpen && (
                <div
                    className={`absolute ${alignmentClass} mt-2 min-w-[14rem] rounded-[var(--radius-card)] border border-border bg-card shadow-[var(--shadow-lift)] z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200`}
                >
                    <div className="py-1.5">
                        {items.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    if (!item.disabled) {
                                        item.onClick();
                                        setIsOpen(false);
                                    }
                                }}
                                disabled={item.disabled}
                                className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-all duration-150 min-h-[44px] ${
                                    item.variant === "danger"
                                        ? "text-danger-500 hover:bg-danger-50 active:bg-danger-100"
                                        : "text-text hover:bg-surface-muted active:bg-surface-subtle"
                                } ${
                                    item.disabled
                                        ? "opacity-50 cursor-not-allowed"
                                        : "cursor-pointer"
                                }`}
                            >
                                {item.icon && (
                                    <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                        {item.icon}
                                    </span>
                                )}
                                <span className="font-medium">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
