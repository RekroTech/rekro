import { Icon } from "../common/Icon";

interface EmailSentSuccessProps {
    email?: string;
    message?: string;
}

export function EmailSentSuccess({ email, message }: EmailSentSuccessProps) {
    return (
        <div className="space-y-4">
            <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-primary-500/10 flex items-center justify-center">
                    <Icon name="mail" className="h-8 w-8 text-primary-500" />
                </div>
            </div>

            <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Check your email</h3>
                {email && (
                    <p className="text-sm text-text-muted">
                        We sent a magic link to{" "}
                        <strong className="text-foreground">{email}</strong>
                    </p>
                )}
                {message && !email && (
                    <p className="text-sm text-text-muted">{message}</p>
                )}
            </div>

            <div className="rounded-[10px] bg-primary-500/10 border border-primary-500/30 p-4">
                <div className="flex items-start gap-3">
                    <Icon
                        name="info"
                        className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0"
                    />
                    <div className="text-sm text-primary-600 dark:text-primary-400">
                        <p className="font-semibold mb-1">Click the link in your email to continue</p>
                        <p>
                            The link will expire in 1 hour. Check your spam folder if you don&apos;t
                            see it.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

