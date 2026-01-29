import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { SignupCredentials, LoginCredentials, User } from "@/types/auth.types";
import { createClient } from "@/lib/supabase/client";

export function useUser() {
    return useQuery({
        queryKey: ["user"],
        queryFn: async (): Promise<User | null> => {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                return null;
            }

            return {
                id: user.id,
                email: user.email || "",
                name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
                avatar_url: user.user_metadata?.avatar_url || null,
            };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useSignup() {
    const router = useRouter();

    return useMutation({
        mutationFn: (credentials: SignupCredentials) => authService.signup(credentials),
        onSuccess: () => {
            setTimeout(() => {
                router.push("/dashboard");
                router.refresh();
            }, 1000);
        },
    });
}

export function useLogin() {
    const router = useRouter();

    return useMutation({
        mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
        onSuccess: () => {
            router.push("/dashboard");
            router.refresh();
        },
    });
}

export function useLogout() {
    const router = useRouter();

    return useMutation({
        mutationFn: () => authService.logout(),
        onSuccess: () => {
            router.push("/login");
            router.refresh();
        },
    });
}
