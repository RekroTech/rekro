import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import type { SignupCredentials, LoginCredentials, User } from "@/types/auth.types";
import { createClient } from "@/lib/supabase/client";

export function useUser() {
    return useQuery<User | null, Error>({
        queryKey: ["user"],
        queryFn: async () => {
            const supabase = createClient();
            const { data, error } = await supabase.auth.getUser();

            // Logged-out is normal
            if (error?.message === "Auth session missing!") return null;
            if (error) throw new Error(error.message);

            const user = data.user;
            if (!user) return null;

            return {
                id: user.id,
                email: user.email ?? "",
                name:
                    (typeof user.user_metadata?.name === "string"
                        ? user.user_metadata.name
                        : undefined) ??
                    user.email?.split("@")[0] ??
                    "User",
                avatar_url:
                    typeof user.user_metadata?.avatar_url === "string"
                        ? user.user_metadata.avatar_url
                        : null,
            };
        },
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        retry: false,
    });
}

export function useSignup() {
    const router = useRouter();

    return useMutation<void, Error, SignupCredentials>({
        mutationFn: async (credentials) => {
            // authService should throw on failure
            await authService.signup(credentials);
        },
        onSuccess: () => {
            router.replace("/dashboard");
        },
    });
}

export function useLogin() {
    const router = useRouter();

    return useMutation<void, Error, LoginCredentials>({
        mutationFn: async (credentials) => {
            // authService should throw on failure
            await authService.login(credentials);
        },
        onSuccess: () => {
            router.replace("/dashboard");
        },
    });
}

export function useLogout() {
    const router = useRouter();

    return useMutation<void, Error, void>({
        mutationFn: async () => {
            // authService should throw on failure
            await authService.logout();
        },
        onSuccess: () => {
            router.replace("/login");
        },
    });
}
