import Link from "next/link";
import { LogoIcon, LogoText } from "@/components/common";

type FooterLink = { label: string; href: string; external?: boolean };

const FOOTER_LINKS: FooterLink[] = [
    { label: "FAQs", href: "/faqs" },
    { label: "Privacy Policy", href: "https://www.rekro.com.au/privacy-policy", external: true },
    { label: "Terms & Conditions", href: "https://www.rekro.com.au/terms-and-conditions", external: true },
    { label: "I am a landlord", href: "/landlords" },
];

export function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer className="border-t border-border bg-card mt-auto" role="contentinfo">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

                {/* Main content */}
                <div className="flex flex-col items-center sm:flex-row sm:items-start sm:justify-between gap-8">

                    {/* Brand block */}
                    <div className="flex flex-col gap-3 items-center sm:items-start sm:max-w-[250px]">
                        <Link href="/" className="flex items-end gap-2" aria-label="Go to home">
                            <LogoIcon className="h-7 w-auto" />
                            <LogoText className="h-5 w-auto mb-0.5" />
                        </Link>
                        <p className="text-sm text-text-muted leading-relaxed text-center sm:text-left">
                            Smarter renting for modern living
                        </p>
                    </div>

                    {/* Contact + Links */}
                    <div className="flex flex-col items-center sm:items-end gap-4">
                        {/* Contact links — large tap targets on mobile */}
                        <div className="flex flex-col items-center sm:items-end gap-1">
                            <a
                                href="mailto:support@rekro.com.au"
                                className="text-sm text-text-primary font-semibold hover:text-primary-500 transition-colors py-1"
                            >
                                support@rekro.com.au
                            </a>
                            <a
                                href="tel:+61410382251"
                                className="text-sm text-text-primary font-semibold hover:text-primary-500 transition-colors py-1"
                            >
                                +61 410 382 251
                            </a>
                        </div>

                        {/* Nav links */}
                        <nav
                            aria-label="Footer navigation"
                            className="flex flex-wrap justify-center sm:justify-end items-center gap-x-5 gap-y-3"
                        >
                            {FOOTER_LINKS.map(({ label, href, external }) => (
                                <Link
                                    key={label}
                                    href={href}
                                    className="text-sm text-text-muted hover:text-primary-500 transition-colors whitespace-nowrap py-1"
                                    {...(external && { target: "_blank", rel: "noopener noreferrer" })}
                                >
                                    {label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-8 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center">
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
