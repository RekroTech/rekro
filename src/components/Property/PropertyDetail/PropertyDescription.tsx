interface PropertyDescriptionProps {
    description: string | null;
}
export function PropertyDescription({ description }: PropertyDescriptionProps) {
    return (
        <div>
            <h2 className="text-2xl font-bold text-text mb-4">About the property</h2>
            <p className="text-text-muted leading-relaxed whitespace-pre-line">
                {description || "No description available."}
            </p>
        </div>
    );
}
