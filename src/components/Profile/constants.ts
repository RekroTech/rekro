/**
 * Default expanded sections for the profile page
 */
export const DEFAULT_EXPANDED_SECTIONS: Record<string, boolean> = {
    "personal-details": true,
    "visa-details": false,
    "income-details": false,
    documents: false,
    "location-preferences": false,
};

export const NATIVE_LANGUAGE_OPTIONS = [
    { value: "", label: "Select native language" },
    { value: "English", label: "English" },
    { value: "Spanish", label: "Spanish" },
    { value: "French", label: "French" },
    { value: "German", label: "German" },
    { value: "Italian", label: "Italian" },
    { value: "Portuguese", label: "Portuguese" },
    { value: "Arabic", label: "Arabic" },
    { value: "Hindi", label: "Hindi" },
    { value: "Bengali", label: "Bengali" },
    { value: "Urdu", label: "Urdu" },
    { value: "Mandarin", label: "Mandarin" },
    { value: "Cantonese", label: "Cantonese" },
    { value: "Japanese", label: "Japanese" },
    { value: "Korean", label: "Korean" },
    { value: "Vietnamese", label: "Vietnamese" },
    { value: "Russian", label: "Russian" },
    { value: "Turkish", label: "Turkish" },
    { value: "Other", label: "Other" },
];

export const VISA_TYPE_OPTIONS = [
    { value: "", label: "Select visa type" },
    { value: "student", label: "Student Visa" },
    { value: "work", label: "Work Visa" },
    { value: "working_holiday", label: "Working Holiday Visa" },
    { value: "temporary_graduate", label: "Temporary Graduate Visa" },
    { value: "partner", label: "Partner Visa" },
    { value: "permanent_resident", label: "Permanent Resident" },
    { value: "other", label: "Other" },
];

export const EMPLOYMENT_TYPE_OPTIONS = [
    { value: "", label: "Select employment status" },
    { value: "full-time", label: "Full-time employed" },
    { value: "part-time", label: "Part-time employed" },
    { value: "self-employed", label: "Self-employed" },
    { value: "contractor", label: "Contractor/Freelancer" },
];

export const FINANCE_SUPPORT_OPTIONS_STUDENT = [
    { value: "", label: "Select finance support type" },
    { value: "savings", label: "Personal Savings" },
    { value: "parents", label: "Parents/Family Support" },
    { value: "scholarship", label: "Scholarship" },
    { value: "student-loan", label: "Student Loan" },
    { value: "investments", label: "Investments/Dividends" },
    { value: "other", label: "Other" },
];

export const FINANCE_SUPPORT_OPTIONS_NON_STUDENT = [
    { value: "", label: "Select finance support type" },
    { value: "savings", label: "Personal Savings" },
    { value: "parents", label: "Parents/Family Support" },
    { value: "investments", label: "Investments/Dividends" },
    { value: "pension", label: "Pension/Retirement" },
    { value: "other", label: "Other" },
];

export const INCOME_FREQUENCY_OPTIONS = [
    { value: "", label: "Select frequency" },
    { value: "weekly", label: "Weekly" },
    { value: "fortnightly", label: "Fortnightly" },
    { value: "monthly", label: "Monthly" },
    { value: "annually", label: "Annually" },
];

