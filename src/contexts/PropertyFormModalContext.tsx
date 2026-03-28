"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface PropertyFormModalContextType {
    isOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
}

const PropertyFormModalContext = createContext<PropertyFormModalContextType | undefined>(undefined);

/**
 * PropertyFormModalProvider - Context for managing PropertyForm modal state
 *
 * Provides centralized state for the "Add Property" modal across the app.
 * Can be triggered from Header or any admin page.
 */
export function PropertyFormModalProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const openModal = useCallback(() => setIsOpen(true), []);
    const closeModal = useCallback(() => setIsOpen(false), []);

    return (
        <PropertyFormModalContext.Provider value={{ isOpen, openModal, closeModal }}>
            {children}
        </PropertyFormModalContext.Provider>
    );
}

export function usePropertyFormModal() {
    const context = useContext(PropertyFormModalContext);
    if (context === undefined) {
        throw new Error("usePropertyFormModal must be used within PropertyFormModalProvider");
    }
    return context;
}

