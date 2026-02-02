export default function Loader() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-app-bg">
            <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
                <p className="mt-2 text-text-muted">Loading...</p>
            </div>
        </div>
    );
}
