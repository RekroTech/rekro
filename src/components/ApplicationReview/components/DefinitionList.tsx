import React from "react";
import { clsx } from "clsx";

interface DefinitionListProps {
    children: React.ReactNode;
    columns?: 1 | 2 | 3;
}

export const DefinitionList = React.memo(({ children, columns = 2 }: DefinitionListProps) => {
    return (
        <dl
            className={clsx(
                "grid gap-x-6 gap-y-1",
                columns === 1 && "grid-cols-1",
                columns === 2 && "grid-cols-1 sm:grid-cols-2",
                columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            )}
        >
            {children}
        </dl>
    );
});

DefinitionList.displayName = "DefinitionList";

