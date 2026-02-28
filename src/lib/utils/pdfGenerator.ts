import { formatDateLong, formatRentalDuration } from "@/lib/utils";

interface ApplicationPDFData {
    id: string;
    status: string;
    submitted_at: string;
    created_at: string;
    updated_at: string;
    move_in_date: string;
    rental_duration: number;
    proposed_rent: number | null;
    total_rent: number;
    message: string | null;
    property: {
        title: string;
        location: {
            city: string;
            state: string;
        };
    };
    unit: {
        name: string;
        listing_type: string;
        price: number;
    };
}

export const generateApplicationPDF = async (application: ApplicationPDFData) => {
    // Dynamically import jsPDF only when needed (~150KB saved from initial bundle)
    const { default: jsPDF } = await import("jspdf");

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = 20;

    // Helper function to add text with automatic wrapping
    const addText = (
        text: string,
        x: number,
        y: number,
        fontSize: number = 10,
        style: "normal" | "bold" = "normal",
        color: [number, number, number] = [0, 0, 0]
    ) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", style);
        doc.setTextColor(color[0], color[1], color[2]);
        const lines = doc.splitTextToSize(text, contentWidth);
        doc.text(lines, x, y);
        return y + lines.length * (fontSize * 0.4) + 2;
    };

    // Helper function to add a section divider
    const addDivider = (y: number) => {
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, y, pageWidth - margin, y);
        return y + 8;
    };

    // Brand color (primary teal)
    const primaryColor: [number, number, number] = [58, 127, 121];
    const textColor: [number, number, number] = [34, 34, 34];
    const mutedColor: [number, number, number] = [102, 102, 102];

    // ===== HEADER =====
    doc.setFillColor(58, 127, 121);
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("reKro", margin, 20);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Rental Application", margin, 30);

    yPos = 50;

    // ===== APPLICATION HEADER =====
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text("Application Details", margin, yPos);
    yPos += 10;

    // Reference and Status
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(`Reference: #${application.id.substring(0, 8).toUpperCase()}`, margin, yPos);

    // Status badge
    const statusText = application.status.replace("_", " ").toUpperCase();
    const statusX = pageWidth - margin - 40;
    doc.setFillColor(234, 242, 241);
    doc.roundedRect(statusX - 5, yPos - 5, 45, 8, 2, 2, "F");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text(statusText, statusX, yPos);

    yPos += 12;
    yPos = addDivider(yPos);

    // ===== PROPERTY DETAILS =====
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text("Property Information", margin, yPos);
    yPos += 8;

    // Property title
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    yPos = addText(application.property.title, margin, yPos, 12, "bold", textColor);

    // Location
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    yPos = addText(
        `📍 ${application.property.location.city}, ${application.property.location.state}`,
        margin,
        yPos,
        10,
        "normal",
        mutedColor
    );

    yPos += 4;

    // Unit details
    const unitType = application.unit.listing_type === "entire_home" ? "Entire Home" : "Room";
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`Unit Type: ${unitType}`, margin, yPos);
    doc.text(`Weekly Price: $${application.unit.price}`, pageWidth / 2, yPos);
    yPos += 10;

    yPos = addDivider(yPos);

    // ===== APPLICATION DETAILS =====
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text("Rental Details", margin, yPos);
    yPos += 8;

    // Details grid
    const detailsData = [
        { label: "Move-in Date", value: formatDateLong(application.move_in_date) },
        { label: "Rental Duration", value: formatRentalDuration(application.rental_duration) || "" },
        { label: "Total Rent", value: `$${application.total_rent}/week` },
        { label: "Proposed Rent", value: application.proposed_rent ? `$${application.proposed_rent}` : "Not specified" },
    ];

    detailsData.forEach((item, index) => {
        const xPos = index % 2 === 0 ? margin : pageWidth / 2;

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(item.label, xPos, yPos);

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(item.value, xPos, yPos + 5);

        if (index % 2 === 1) {
            yPos += 15;
        }
    });

    if (detailsData.length % 2 === 1) {
        yPos += 15;
    }

    // Message
    if (application.message) {
        yPos += 5;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text("Applicant Message", margin, yPos);
        yPos += 5;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        yPos = addText(application.message, margin, yPos, 10, "normal", textColor);
    }

    yPos += 5;
    yPos = addDivider(yPos);

    // ===== TIMESTAMPS =====
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text("Timeline", margin, yPos);
    yPos += 8;

    const timestamps = [
        { label: "Created", value: new Date(application.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) },
        { label: "Submitted", value: application.submitted_at ? new Date(application.submitted_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : "Not submitted" },
        { label: "Last Updated", value: new Date(application.updated_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) },
    ];

    timestamps.forEach((item) => {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(`${item.label}:`, margin, yPos);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(item.value, margin + 35, yPos);
        yPos += 6;
    });

    // ===== FOOTER =====
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(
        `Generated on ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`,
        margin,
        footerY
    );
    doc.text("reKro - Your Rental Platform", pageWidth - margin - 60, footerY);

    // Save the PDF
    const fileName = `reKro-Application-${application.id.substring(0, 8).toUpperCase()}.pdf`;
    doc.save(fileName);
};

