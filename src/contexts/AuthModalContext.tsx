"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface AuthModalContextType {
    isAuthModalOpen: boolean;
    openAuthModal: (redirectTo?: string) => void;
    closeAuthModal: () => void;
    redirectTo?: string;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [redirectTo, setRedirectTo] = useState<string | undefined>();

    const openAuthModal = useCallback((redirect?: string) => {
        setRedirectTo(redirect);
        setIsAuthModalOpen(true);
    }, []);

    const closeAuthModal = useCallback(() => {
        setIsAuthModalOpen(false);
        // Clear redirect after a delay to avoid flash during close animation
        setTimeout(() => setRedirectTo(undefined), 300);
    }, []);

    return (
        <AuthModalContext.Provider
            value={{
                isAuthModalOpen,
                openAuthModal,
                closeAuthModal,
                redirectTo,
            }}
        >
            {children}
        </AuthModalContext.Provider>
    );
}

export function useAuthModal() {
    const context = useContext(AuthModalContext);
    if (context === undefined) {
        throw new Error("useAuthModal must be used within an AuthModalProvider");
    }
    return context;
}

