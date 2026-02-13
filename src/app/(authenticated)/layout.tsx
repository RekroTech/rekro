import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";

// Force dynamic rendering for auth checks
export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    const user = await getSession();

    if (!user) {
        redirect("/login");
    }

    return <>{children}</>;
}
