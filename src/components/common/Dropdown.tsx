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
                className="flex items-center focus:outline-none"
                type="button"
            >
                {trigger}
            </button>

            {isOpen && (
                <div
                    className={`absolute ${alignmentClass} mt-2 w-56 rounded-[var(--radius-lg)] border border-border bg-card shadow-[var(--shadow-deep)] z-50`}
                >
                    <div className="py-1">
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
                                className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                                    item.variant === "danger"
                                        ? "text-danger-500 hover:bg-danger-50"
                                        : "text-text hover:bg-surface-muted"
                                } ${
                                    item.disabled
                                        ? "opacity-50 cursor-not-allowed"
                                        : "cursor-pointer"
                                }`}
                            >
                                {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
