"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { EmailVerificationError } from "@/components/Auth";

interface AuthModalContextType {
    isAuthModalOpen: boolean;
    openAuthModal: (redirectTo?: string, errorMessage?: string) => void;
    closeAuthModal: () => void;
    redirectTo?: string;
    authModalError?: string;
    verificationError: EmailVerificationError | null;
    setVerificationError: (error: EmailVerificationError | null) => void;
    isVerified: boolean;
    setIsVerified: (verified: boolean) => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [redirectTo, setRedirectTo] = useState<string | undefined>();
    const [authModalError, setAuthModalError] = useState<string | undefined>();
    const [verificationError, setVerificationError] = useState<EmailVerificationError | null>(null);
    const [isVerified, setIsVerified] = useState(false);

    const openAuthModal = useCallback((redirect?: string, errorMessage?: string) => {
        setRedirectTo(redirect);
        setAuthModalError(errorMessage);
        setIsAuthModalOpen(true);
    }, []);

    const closeAuthModal = useCallback(() => {
        setIsAuthModalOpen(false);
        // Clear redirect and error after a delay to avoid flash during close animation
        setTimeout(() => {
            setRedirectTo(undefined);
            setAuthModalError(undefined);
        }, 300);
    }, []);

    return (
        <AuthModalContext.Provider
            value={{
                isAuthModalOpen,
                openAuthModal,
                closeAuthModal,
                redirectTo,
                authModalError,
                verificationError,
                setVerificationError,
                isVerified,
                setIsVerified,
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

