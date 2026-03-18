/**
 * React Email template — Confirmation email sent to enquirer
 */

import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";
import type { EnquiryConfirmation } from "./schemas";

export default function EnquiryConfirmationEmail(data: EnquiryConfirmation) {
    const {
        propertyTitle,
        propertyAddress,
        propertyUrl,
        unitName,
        listingType,
        message,
        recipientName,
    } = data;

    const preview = `We've received your enquiry for ${propertyTitle}${unitName && listingType !== "entire_property" ? ` - ${unitName}` : ""}`;

    return (
        <Html lang="en">
            <Head />
            <Preview>{preview}</Preview>
            <Body style={body}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={h1}>Enquiry Received!</Heading>
                        <Text style={subtext}>
                            {recipientName ? `Hi ${recipientName},` : "Thank you for your enquiry!"}
                            {"\n"}
                            We&apos;ve received your message and we will be in touch soon.
                        </Text>
                    </Section>

                    {/* Success Icon */}
                    <Section style={iconSection}>
                        <div style={iconCircle}>✓</div>
                    </Section>

                    {/* Enquiry Summary */}
                    <Section style={section}>
                        <Heading as="h2" style={{ ...h2, textAlign: "center" }}>
                            Enquiry Summary
                        </Heading>
                        <Section style={summaryBox}>
                            <table style={detailTable}>
                                <tbody>
                                    <tr>
                                        <td style={labelCell}>Property:</td>
                                        <td style={valueCell}>{propertyTitle}</td>
                                    </tr>
                                    {propertyAddress && (
                                        <tr>
                                            <td style={labelCell}>Address:</td>
                                            <td style={valueCell}>{propertyAddress}</td>
                                        </tr>
                                    )}
                                    {unitName && listingType !== "entire_property" && (
                                        <tr>
                                            <td style={labelCell}>Unit:</td>
                                            <td style={valueCell}>{unitName}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            <Text style={yourMessageLabel}>Your Message:</Text>
                            <Text style={messageText}>{message}</Text>
                        </Section>
                    </Section>

                    {/* What's Next */}
                    <Section style={section}>
                        <Heading as="h3" style={h3}>
                            What happens next?
                        </Heading>
                        <Text style={listItem}>• We will review your enquiry</Text>
                        <Text style={listItem}>
                            • We will contact you directly via email or phone
                        </Text>
                        <Text style={listItem}>
                            • Response time is typically within 24–48 hours
                        </Text>
                    </Section>

                    {propertyUrl && (
                        <Section style={ctaSection}>
                            <Button href={propertyUrl} style={button}>
                                View Property
                            </Button>
                        </Section>
                    )}

                    <Hr style={hr} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            This is an automated confirmation from reKro.{"\n"}
                            Please do not reply to this email.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

EnquiryConfirmationEmail.PreviewProps = {
    enquiryId: "00000000-0000-0000-0000-000000000002",
    propertyTitle: "The Grand Apartments",
    propertyAddress: "123 Elizabeth Street, Melbourne VIC 3000",
    propertyUrl: "https://rekro.com.au/property/00000000-0000-0000-0000-000000000010?unit=00000000-0000-0000-0000-000000000020",
    unitName: "Unit 4B",
    message:
        "Hi, I'm interested in this property. Could you please provide more details about the lease terms and available move-in dates?",
    recipientEmail: "jane.smith@example.com",
    recipientName: "Jane",
} satisfies EnquiryConfirmation;

// ─── Styles ───────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
    backgroundColor: "#f5f5f5",
    fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    margin: 0,
    padding: 0,
};

const container: React.CSSProperties = {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    margin: "20px auto",
    maxWidth: "600px",
};

const header: React.CSSProperties = {
    borderBottom: "1px solid #e5e5e5",
    padding: "32px 32px 24px",
    textAlign: "center",
};

const section: React.CSSProperties = {
    padding: "24px 32px",
};

const iconSection: React.CSSProperties = {
    padding: "24px 32px",
    textAlign: "center",
};

const iconCircle: React.CSSProperties = {
    backgroundColor: "#10b981",
    borderRadius: "50%",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "32px",
    height: "64px",
    lineHeight: "64px",
    textAlign: "center",
    width: "64px",
};

const h1: React.CSSProperties = {
    color: "#1a1a1a",
    fontSize: "24px",
    fontWeight: "600",
    margin: "0",
};

const h2: React.CSSProperties = {
    color: "#1a1a1a",
    fontSize: "18px",
    fontWeight: "600",
    margin: "0 0 16px 0",
};

const h3: React.CSSProperties = {
    color: "#1a1a1a",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0 0 12px 0",
};

const subtext: React.CSSProperties = {
    color: "#666666",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "12px 0 0 0",
    whiteSpace: "pre-line",
};

const summaryBox: React.CSSProperties = {
    backgroundColor: "#f9f9f9",
    borderRadius: "6px",
    padding: "16px",
};

const detailTable: React.CSSProperties = {
    borderCollapse: "collapse",
    width: "100%",
};

const labelCell: React.CSSProperties = {
    color: "#666666",
    fontSize: "14px",
    fontWeight: "bold",
    padding: "6px 12px 6px 0",
    verticalAlign: "top",
    whiteSpace: "nowrap",
    width: "80px",
};

const valueCell: React.CSSProperties = {
    color: "#1a1a1a",
    fontSize: "14px",
    padding: "6px 0",
    verticalAlign: "top",
};

const yourMessageLabel: React.CSSProperties = {
    color: "#666666",
    fontSize: "14px",
    fontWeight: "bold",
    margin: "12px 0 4px 0",
};

const messageText: React.CSSProperties = {
    color: "#333333",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0",
    whiteSpace: "pre-wrap",
};

const listItem: React.CSSProperties = {
    color: "#666666",
    fontSize: "14px",
    lineHeight: "1.8",
    margin: "0",
};

const ctaSection: React.CSSProperties = {
    ...section,
    paddingTop: "0",
    textAlign: "center",
};

const button: React.CSSProperties = {
    backgroundColor: "#0066cc",
    borderRadius: "6px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "14px",
    fontWeight: "600",
    padding: "12px 32px",
    textDecoration: "none",
};

const hr: React.CSSProperties = {
    borderColor: "#e5e5e5",
    margin: "0 32px",
};

const footer: React.CSSProperties = {
    backgroundColor: "#f9f9f9",
    borderRadius: "0 0 8px 8px",
    padding: "24px 32px",
    textAlign: "center",
};

const footerText: React.CSSProperties = {
    color: "#666666",
    fontSize: "12px",
    margin: "0",
    whiteSpace: "pre-line",
};
