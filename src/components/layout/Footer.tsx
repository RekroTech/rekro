import Link from "next/link";
import { LogoIcon, LogoText } from "@/components/common";

type FooterLink = { label: string; href: string; external?: boolean };

const FOOTER_LINKS: Record<string, FooterLink[]> = {
    Company: [
        { label: "About", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Blog", href: "/blog" },
    ],
    Renters: [
        { label: "Browse Properties", href: "/" },
        { label: "How It Works", href: "/how-it-works" },
        { label: "FAQs", href: "/faqs" },
    ],
    Legal: [
        { label: "Privacy Policy", href: "https://www.rekro.com.au/privacy-policy", external: true },
        { label: "Terms & Conditions", href: "https://www.rekro.com.au/terms-and-conditions", external: true },
        { label: "Cookie Policy", href: "https://www.rekro.com.au/privacy-policy#cookies", external: true },
    ],
};

export function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer className="border-t border-border bg-card mt-auto" role="contentinfo">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

                {/* Main content */}
                <div className="flex flex-col sm:flex-row sm:justify-between gap-8">

                    {/* Brand block — full width on mobile, fixed width on desktop */}
                    <div className="flex flex-col gap-3 items-center sm:items-start sm:max-w-[200px]">
                        <Link href="/" className="flex items-end gap-2" aria-label="Go to home">
                            <LogoIcon className="h-7 w-auto" />
                            <LogoText className="h-5 w-auto mb-0.5" />
                        </Link>
                        <p className="text-sm text-text-muted leading-relaxed text-center sm:text-left">
                            Connect, make friends, and find your next home.
                        </p>
                    </div>

                    {/* Link columns — 3 equal cols, always */}
                    <div className="grid grid-cols-3 gap-6 sm:gap-10 lg:gap-16">
                        {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
                            <div key={heading}>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-subtle mb-3 whitespace-nowrap">
                                    {heading}
                                </h3>
                                <ul className="space-y-2">
                                    {links.map(({ label, href, external }) => (
                                        <li key={label}>
                                            <Link
                                                href={href}
                                                className="text-sm text-text-muted hover:text-primary-500 transition-colors"
                                                {...(external && { target: "_blank", rel: "noopener noreferrer" })}
                                            >
                                                {label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-8 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
                    <p className="text-xs text-text-subtle">
                        &copy; {year} reKro. All rights reserved.
                    </p>
                    <p className="text-xs text-text-subtle">
                        Simplifying the rental experience across Australia.
                    </p>
                </div>
            </div>
        </footer>
    );
}
