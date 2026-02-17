import React from "react";
import { Icon } from "@/components/common";

interface Document {
    url: string;
    filename: string;
}

interface DocumentListProps {
    documents: Record<string, Document>;
    documentTypes: string[];
    documentLabels: Record<string, string>;
    title: string;
}

export const DocumentList = React.memo(({
    documents,
    documentTypes,
    documentLabels,
    title,
}: DocumentListProps) => {
    const filteredDocuments = React.useMemo(() => {
        return Object.entries(documents).filter(([type]) => documentTypes.includes(type));
    }, [documents, documentTypes]);

    if (filteredDocuments.length === 0) {
        return null;
    }

    return (
        <div className="mt-4 pt-4 border-t border-border">
            <span className="text-text-muted text-xs block mb-3 uppercase tracking-wide font-semibold">
                {title}
            </span>
            <div className="grid grid-cols-1 gap-2">
                {filteredDocuments.map(([type, doc]) => (
                    <DocumentItem
                        key={type}
                        label={documentLabels[type] || type}
                        filename={doc.filename}
                        url={doc.url}
                    />
                ))}
            </div>
        </div>
    );
});

DocumentList.displayName = "DocumentList";

interface DocumentItemProps {
    label: string;
    filename: string;
    url: string;
}

const DocumentItem = React.memo(({ label, filename, url }: DocumentItemProps) => {
    return (
        <div className="flex items-center justify-between bg-surface-subtle hover:bg-surface-muted transition-colors px-3 py-2.5 rounded-[var(--radius-input)] border border-border/50">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary-50 border border-primary-200 flex items-center justify-center">
                    <Icon name="file" className="w-4 h-4 text-primary-600" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-text text-sm font-medium">{label}</p>
                    <p className="text-text-muted text-xs truncate">{filename}</p>
                </div>
            </div>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 ml-2 text-primary-600 hover:text-primary-700 transition-colors"
            >
                <Icon name="eye" className="w-4 h-4" />
            </a>
        </div>
    );
});

DocumentItem.displayName = "DocumentItem";

