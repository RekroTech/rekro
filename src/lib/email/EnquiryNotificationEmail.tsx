/**
 * React Email template — Admin notification for new enquiry
 */

import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";
import type { EnquiryNotification } from "./schemas";

export default function EnquiryNotificationEmail(data: EnquiryNotification) {
    const { propertyTitle, unitName, listingType, message, senderName, senderEmail, senderPhone, isAuthenticated } = data;

    const preview = `New enquiry for ${propertyTitle}${unitName && listingType !== "entire_property" ? ` - ${unitName}` : ""} from ${senderName ?? senderEmail}`;

    return (
        <Html lang="en">
            <Head />
            <Preview>{preview}</Preview>
            <Body style={body}>
                <Container style={container}>

                    {/* Header */}
                    <Section style={header}>
                        <Heading style={h1}>New Property Enquiry</Heading>
                        <Text style={subtext}>
                            You have received a new enquiry from{" "}
                            {isAuthenticated ? "a registered user" : "a potential tenant"}
                        </Text>
                    </Section>

                    {/* Property Details */}
                    <Section style={section}>
                        <Heading as="h2" style={h2}>Property Details</Heading>
                        <table style={detailTable}>
                            <tbody>
                                <tr>
                                    <td style={labelCell}>Property:</td>
                                    <td style={valueCell}>{propertyTitle}</td>
                                </tr>
                                {unitName && listingType !== "entire_property" && (
                                    <tr>
                                        <td style={labelCell}>Unit:</td>
                                        <td style={valueCell}>{unitName}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </Section>

                    {/* Contact Information */}
                    <Section style={section}>
                        <Heading as="h2" style={h2}>Contact Information</Heading>
                        <table style={detailTable}>
                            <tbody>
                                {senderName && (
                                    <tr>
                                        <td style={labelCell}>Name:</td>
                                        <td style={valueCell}>{senderName}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td style={labelCell}>Email:</td>
                                    <td style={valueCell}>
                                        <Link href={`mailto:${senderEmail}`} style={link}>{senderEmail}</Link>
                                    </td>
                                </tr>
                                {senderPhone && (
                                    <tr>
                                        <td style={labelCell}>Phone:</td>
                                        <td style={valueCell}>
                                            <Link href={`tel:${senderPhone}`} style={link}>{senderPhone}</Link>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </Section>

                    {/* Message */}
                    <Section style={section}>
                        <Heading as="h2" style={h2}>Message</Heading>
                        <Section style={messageBox}>
                            <Text style={messageText}>{message}</Text>
                        </Section>
                    </Section>

                    {/* CTA */}
                    <Section style={{ ...section, textAlign: "center" }}>
                        <Button href={`mailto:${senderEmail}`} style={button}>
                            Reply to Enquiry
                        </Button>
                    </Section>

                    <Hr style={hr} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            This is an automated notification from reKro. Please do not reply to this email.
                        </Text>
                    </Section>

                </Container>
            </Body>
        </Html>
    );
}

EnquiryNotificationEmail.PreviewProps = {
    enquiryId: "00000000-0000-0000-0000-000000000001",
    propertyTitle: "The Grand Apartments",
    unitName: "Unit 4B",
    message: "Hi, I'm interested in this property. Could you please provide more details about the lease terms and available move-in dates?",
    senderName: "Jane Smith",
    senderEmail: "jane.smith@example.com",
    senderPhone: "+61 400 000 000",
    recipientEmail: "admin@rekro.com.au",
    isAuthenticated: true,
} satisfies EnquiryNotification;

// ─── Styles ───────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
    backgroundColor: "#f5f5f5",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
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
};

const section: React.CSSProperties = {
    padding: "24px 32px",
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

const subtext: React.CSSProperties = {
    color: "#666666",
    fontSize: "14px",
    margin: "8px 0 0 0",
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

const link: React.CSSProperties = {
    color: "#0066cc",
    textDecoration: "none",
};

const messageBox: React.CSSProperties = {
    backgroundColor: "#f9f9f9",
    borderLeft: "4px solid #0066cc",
    borderRadius: "4px",
    padding: "16px",
};

const messageText: React.CSSProperties = {
    color: "#333333",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0",
    whiteSpace: "pre-wrap",
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
};

