/**
 * Standardized modal action state interface
 * Used for coordinating form actions with modal footer buttons
 */
export interface ModalActionState {
    /** Primary submit handler */
    onSubmit: () => Promise<void>;
    /** Whether form is currently submitting */
    isSubmitting: boolean;
    /** Whether submit button should be enabled */
    canSubmit: boolean;
    /** Text to display on primary button */
    submitText: string;
    /** Optional back button handler */
    onBack?: () => void;
    /** Cancel/close handler */
    onCancel: () => void;
}

export type ModalStep = "application" | "review" | "confirm";