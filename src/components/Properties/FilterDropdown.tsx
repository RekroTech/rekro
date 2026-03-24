"use client";

import { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { Select, Button } from "@/components/common";
import { PROPERTY_TYPES } from "@/components/PropertyForm";

export interface FilterValues {
    propertyType: string;
    bedrooms: string;
    bathrooms: string;
    minPrice: string;
    maxPrice: string;
    furnishedFilter: string;
}

interface FilterDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    /** Current applied values — used to initialise pending state when opened */
    initialValues: FilterValues;
    onApply: (values: FilterValues) => void;
}

const EMPTY_FILTERS: FilterValues = {
    propertyType: "",
    bedrooms: "",
    bathrooms: "",
    minPrice: "",
    maxPrice: "",
    furnishedFilter: "",
};

export function FilterDropdown({ isOpen, onClose, initialValues, onApply }: FilterDropdownProps) {
    const [pending, setPending] = useState<FilterValues>(initialValues);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync pending state from applied values each time the dropdown opens
    useEffect(() => {
        if (isOpen) {
            setPending(initialValues);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Close on Escape only — click-outside is handled by the parent wrapper
    useEffect(() => {
        if (!isOpen) return;
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const set = <K extends keyof FilterValues>(key: K) =>
        (e: React.ChangeEvent<HTMLSelectElement>) =>
            setPending((p) => ({ ...p, [key]: e.target.value }));

    const pendingCount = Object.values(pending).filter(Boolean).length;

    const handleApply = () => {
        onApply(pending);
        onClose();
    };

    const handleClear = () => {
        setPending(EMPTY_FILTERS);
    };

    return (
        <div
            ref={dropdownRef}
            role="dialog"
            aria-label="Property filters"
            className={clsx(
                "absolute right-0 top-full mt-2 z-50",
                "w-[min(24rem,calc(100vw-1.5rem))]",
                "rounded-xl border border-border bg-card",
                "shadow-[var(--shadow-lift)]",
                "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
            )}
        >
            {/* Filter grid */}
            <div className="p-4 grid grid-cols-2 gap-x-3 gap-y-4">
                <Select
                    id="dd-property-type"
                    value={pending.propertyType}
                    onChange={set("propertyType")}
                    size="sm"
                    label="Property Type"
                    options={PROPERTY_TYPES}
                />
                <Select
                    id="dd-furnished"
                    value={pending.furnishedFilter}
                    onChange={set("furnishedFilter")}
                    size="sm"
                    label="Furnished"
                    options={[
                        { value: "", label: "Any" },
                        { value: "furnished", label: "Furnished" },
                        { value: "unfurnished", label: "Unfurnished" },
                    ]}
                />
                <Select
                    id="dd-bedrooms"
                    value={pending.bedrooms}
                    onChange={set("bedrooms")}
                    size="sm"
                    label="Bedrooms"
                    options={[
                        { value: "", label: "Any" },
                        { value: "1", label: "1 Bed" },
                        { value: "2", label: "2 Beds" },
                        { value: "3", label: "3 Beds" },
                        { value: "4", label: "4+ Beds" },
                    ]}
                />
                <Select
                    id="dd-bathrooms"
                    value={pending.bathrooms}
                    onChange={set("bathrooms")}
                    size="sm"
                    label="Bathrooms"
                    options={[
                        { value: "", label: "Any" },
                        { value: "1", label: "1 Bath" },
                        { value: "2", label: "2 Baths" },
                        { value: "3", label: "3+ Baths" },
                    ]}
                />
                <Select
                    id="dd-min-price"
                    value={pending.minPrice}
                    onChange={set("minPrice")}
                    size="sm"
                    label="Min Rent"
                    options={[
                        { value: "", label: "Any" },
                        { value: "100", label: "$100/wk" },
                        { value: "200", label: "$200/wk" },
                        { value: "300", label: "$300/wk" },
                        { value: "400", label: "$400/wk" },
                        { value: "500", label: "$500/wk" },
                        { value: "600", label: "$600/wk" },
                        { value: "800", label: "$800/wk" },
                        { value: "1000", label: "$1,000/wk" },
                    ]}
                />
                <Select
                    id="dd-max-price"
                    value={pending.maxPrice}
                    onChange={set("maxPrice")}
                    size="sm"
                    label="Max Rent"
                    options={[
                        { value: "", label: "Any" },
                        { value: "200", label: "$200/wk" },
                        { value: "300", label: "$300/wk" },
                        { value: "400", label: "$400/wk" },
                        { value: "500", label: "$500/wk" },
                        { value: "600", label: "$600/wk" },
                        { value: "800", label: "$800/wk" },
                        { value: "1000", label: "$1,000/wk" },
                        { value: "1500", label: "$1,500/wk" },
                        { value: "2000", label: "$2,000/wk" },
                    ]}
                />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
                <button
                    type="button"
                    onClick={handleClear}
                    className="text-sm font-medium text-text-subtle hover:text-foreground underline-offset-2 hover:underline transition-colors"
                >
                    Clear all
                </button>
                <Button size="sm" onClick={handleApply}>
                    {pendingCount > 0 ? `Apply (${pendingCount})` : "Apply"}
                </Button>
            </div>
        </div>
    );
}

