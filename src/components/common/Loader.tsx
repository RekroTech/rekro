export type LoaderSize = "sm" | "md" | "lg";

export interface LoaderProps {
    size?: LoaderSize;
    fullScreen?: boolean;
    text?: string;
}

const sizeClasses: Record<LoaderSize, string> = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-4",
    lg: "h-12 w-12 border-4",
};

export function Loader({ size = "md", fullScreen = false, text }: LoaderProps) {
    const spinner = (
        <div className="flex flex-col items-center justify-center gap-2">
            <div
                className={`${sizeClasses[size]} animate-spin rounded-full border-primary-500 border-t-transparent`}
            />
            {text && <p className="text-sm text-text-muted">{text}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-app-bg">{spinner}</div>
        );
    }

    return spinner;
}

export default Loader;
