import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@/lib/supabase/server";

// Force dynamic for user-specific operations
export const dynamic = "force-dynamic";

type EnquiryBody = {
    name?: unknown;
    email?: unknown;
    phone?: unknown;
    message?: unknown;
    propertyTitle?: unknown;
    propertyId?: unknown;
    unitId?: unknown;
    isEntireHome?: unknown;
};

function isNonEmptyString(v: unknown): v is string {
    return typeof v === "string" && v.trim().length > 0;
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as EnquiryBody;

        // Validate required fields
        const name = isNonEmptyString(body.name) ? body.name.trim() : "";
        const email = isNonEmptyString(body.email) ? body.email.trim() : "";
        const phone = isNonEmptyString(body.phone) ? body.phone.trim() : "";
        const message = isNonEmptyString(body.message) ? body.message.trim() : "";
        const propertyTitle = isNonEmptyString(body.propertyTitle) ? body.propertyTitle : "";
        const propertyId = isNonEmptyString(body.propertyId) ? body.propertyId : "";
        const unitId = isNonEmptyString(body.unitId) ? body.unitId : null;
        const isEntireHome = typeof body.isEntireHome === "boolean" ? body.isEntireHome : false;

        if (!name || !email || !phone || !message) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400, headers: { "Cache-Control": "no-store" } }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400, headers: { "Cache-Control": "no-store" } }
            );
        }

        // const supabase = await createClient();

        // Get current user if authenticated
        // const {
        //     data: { user },
        // } = await supabase.auth.getUser();

        // TODO: Store enquiry in database - create an 'enquiries' table and uncomment the code below
        // For now, we'll just log it and send email notification

        // const _enquiryData = {
        //     user_id: user?.id || null,
        //     property_id: propertyId,
        //     unit_id: unitId,
        //     name,
        //     email,
        //     phone,
        //     message,
        //     is_entire_home: isEntireHome,
        //     created_at: new Date().toISOString(),
        // };

        // TODO: Uncomment when enquiries table is created
        // const { error: dbError } = await supabase
        //     .from('enquiries')
        //     .insert([_enquiryData]);
        //
        // if (dbError) {
        //     console.error("Database error:", dbError);
        //     return NextResponse.json({ error: "Failed to store enquiry" }, { status: 500 });
        // }

        // TODO: Send email to admin
        // This is where you would integrate with an email service like:
        // - SendGrid
        // - AWS SES
        // - Resend
        // - Nodemailer with SMTP

        // For now, we'll simulate the email sending
        console.log("=== New Enquiry Received ===");
        console.log("Property:", propertyTitle);
        console.log("Type:", isEntireHome ? "Entire Home" : "Room");
        console.log("From:", name);
        console.log("Email:", email);
        console.log("Phone:", phone);
        console.log("Message:", message);
        console.log("Property ID:", propertyId);
        console.log("Unit ID:", unitId || "N/A");
        console.log("===========================");

        // TODO: Uncomment and configure when email service is set up
        // await sendEnquiryEmail({
        //     to: process.env.ADMIN_EMAIL || "admin@rekro.com",
        //     subject: `New Enquiry: ${propertyTitle}`,
        //     enquiryData,
        // });

        return NextResponse.json(
            {
                success: true,
                message: "Enquiry sent successfully",
            },
            {
                status: 200,
                headers: {
                    "Cache-Control": "no-store",
                },
            }
        );
    } catch (error) {
        console.error("Error processing enquiry:", error);
        return NextResponse.json(
            { error: "Failed to process enquiry" },
            { status: 500, headers: { "Cache-Control": "no-store" } }
        );
    }
}
