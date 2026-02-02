import Link from "next/link";
import { requireAuth } from "@/lib/auth/server";

export default async function DashboardPage() {
    const user = await requireAuth(); // guaranteed user (redirects otherwise)

    return (
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Welcome card */}
            <div className="card-lg border border-border p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-text">
                            Welcome{user.name ? `, ${user.name}` : ""}!
                        </h2>
                        <p className="mt-1 text-text-muted">
                            This is a protected page. Only authenticated users can access this
                            content.
                        </p>
                    </div>

                    <div className="mt-3 sm:mt-0">
                        <span className="inline-flex items-center gap-2 rounded-[9999px] bg-success-bg px-3 py-1 text-sm font-semibold text-primary-700">
                            Authenticated ✓
                        </span>
                    </div>
                </div>

                {/* Info grid */}
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
                        <h3 className="font-semibold text-text">User ID</h3>
                        <p className="mt-1 break-all text-sm text-text-muted">{user.id}</p>
                    </div>

                    <div className="rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
                        <h3 className="font-semibold text-text">Email</h3>
                        <p className="mt-1 text-sm text-text-muted">{user.email}</p>
                    </div>

                    <div className="rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
                        <h3 className="font-semibold text-text">Status</h3>
                        <p className="mt-1 text-sm font-semibold text-primary-700">
                            Authenticated ✓
                        </p>
                    </div>
                </div>

                {/* Quick actions */}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                        href="/account"
                        className="pill inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-text hover:opacity-90"
                    >
                        Go to Account
                    </Link>
                    <Link
                        href="/accommodations"
                        className="btn-primary-pill inline-flex items-center justify-center"
                    >
                        Browse Accommodations
                    </Link>
                </div>
            </div>
        </main>
    );
}
