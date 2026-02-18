"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface DocumentOperationsContextValue {
    isAnyOperationInProgress: boolean;
    startOperation: (operationId: string) => void;
    endOperation: (operationId: string) => void;
}

const DocumentOperationsContext = createContext<DocumentOperationsContextValue | undefined>(undefined);

export function DocumentOperationsProvider({ children }: { children: ReactNode }) {
    const [activeOperations, setActiveOperations] = useState<Set<string>>(new Set());

    const startOperation = useCallback((operationId: string) => {
        setActiveOperations((prev) => new Set(prev).add(operationId));
    }, []);

    const endOperation = useCallback((operationId: string) => {
        setActiveOperations((prev) => {
            const next = new Set(prev);
            next.delete(operationId);
            return next;
        });
    }, []);

    const isAnyOperationInProgress = activeOperations.size > 0;

    return (
        <DocumentOperationsContext.Provider value={{ isAnyOperationInProgress, startOperation, endOperation }}>
            {children}
        </DocumentOperationsContext.Provider>
    );
}

export function useDocumentOperations() {
    const context = useContext(DocumentOperationsContext);
    if (!context) {
        throw new Error("useDocumentOperations must be used within DocumentOperationsProvider");
    }
    return context;
}

