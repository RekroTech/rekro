import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Use CSS variables from globals.css
                background: "var(--background)",
                foreground: "var(--foreground)",
                surface: "var(--surface)",
                "surface-subtle": "var(--surface-subtle)",
                "surface-muted": "var(--surface-muted)",
                "app-bg": "var(--app-bg)",
                card: "var(--card)",
                panel: "var(--panel)",
                text: "var(--text)",
                "text-muted": "var(--text-muted)",
                "text-subtle": "var(--text-subtle)",
                border: "var(--border)",
                "focus-ring": "var(--focus-ring)",
                "input-bg": "var(--input-bg)",
                "input-border": "var(--input-border)",
                primary: {
                    50: "var(--primary-50)",
                    100: "var(--primary-100)",
                    200: "var(--primary-200)",
                    300: "var(--primary-300)",
                    400: "var(--primary-400)",
                    500: "var(--primary-500)",
                    600: "var(--primary-600)",
                    700: "var(--primary-700)",
                    800: "var(--primary-800)",
                    900: "var(--primary-900)",
                },
                secondary: {
                    50: "var(--secondary-50)",
                    100: "var(--secondary-100)",
                    200: "var(--secondary-200)",
                    300: "var(--secondary-300)",
                    400: "var(--secondary-400)",
                    500: "var(--secondary-500)",
                    600: "var(--secondary-600)",
                    700: "var(--secondary-700)",
                    800: "var(--secondary-800)",
                    900: "var(--secondary-900)",
                },
                danger: {
                    500: "var(--danger-500)",
                    600: "var(--danger-600)",
                },
                warning: {
                    50: "var(--warning-50)",
                    200: "var(--warning-200)",
                    500: "var(--warning-500)",
                    600: "var(--warning-600)",
                    700: "var(--warning-700)",
                    800: "var(--warning-800)",
                },
                "auth-note": "var(--auth-note)",
                "auth-support": "var(--auth-support)",
                "auth-text-strong": "var(--auth-text-strong)",
            },
            fontFamily: {
                sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
                mono: ["var(--font-geist-mono)", "monospace"],
            },
        },
    },
    future: {
        hoverOnlyWhenSupported: true,
    },
};

export default config;
