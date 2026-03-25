import type { LucideIcon } from "lucide-react";

export interface EmailVerificationError {
    title: string;
    message: string;
    icon: LucideIcon;
    canResend: boolean;
}