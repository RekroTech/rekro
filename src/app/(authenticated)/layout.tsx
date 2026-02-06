import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";

// Force dynamic rendering for auth checks
export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    const user = await getSession();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="h-screen overflow-hidden bg-app-bg text-foreground">
            <div className="h-[calc(100vh-4rem)] overflow-y-auto mt-16">{children}</div>
        </div>
    );
}
