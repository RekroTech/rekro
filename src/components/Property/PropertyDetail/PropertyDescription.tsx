interface PropertyDescriptionProps {
    description: string | null;
}
export function PropertyDescription({ description }: PropertyDescriptionProps) {
    return (
        <div>
            <h2 className="text-xl sm:text-2xl font-bold text-text mb-3 sm:mb-4">
                About the property
            </h2>
            <p className="text-sm sm:text-base text-text-muted leading-relaxed whitespace-pre-line">
                {description || "No description available."}
            </p>
        </div>
    );
}
