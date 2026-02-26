export interface EmailVerificationError {
    title: string;
    message: string;
    icon: "info" | "x";
    canResend: boolean;
}