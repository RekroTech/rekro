import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

        const supabase = await createClient();

        // Get current user if authenticated
        const {
            data: { user },
        } = await supabase.auth.getUser();

        // If user is logged in, get name and email from user data
        // Otherwise, require them in the request body
        let name: string;
        let email: string;

        if (user) {
            // User is logged in - get data from session
            name = (user.user_metadata?.name as string) || user.email?.split("@")[0] || "User";
            email = user.email || "";
        } else {
            // Guest user - require name and email in body
            name = isNonEmptyString(body.name) ? body.name.trim() : "";
            email = isNonEmptyString(body.email) ? body.email.trim() : "";

            if (!name || !email) {
                return NextResponse.json(
                    { error: "Name and email are required for guest enquiries" },
                    { status: 400, headers: { "Cache-Control": "no-store" } }
                );
            }

            // Validate email format for guest users
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return NextResponse.json(
                    { error: "Invalid email format" },
                    { status: 400, headers: { "Cache-Control": "no-store" } }
                );
            }
        }

        // Validate other required fields (same for both logged-in and guest users)
        let phone = isNonEmptyString(body.phone) ? body.phone.trim() : "";
        const message = isNonEmptyString(body.message) ? body.message.trim() : "";
        const propertyTitle = isNonEmptyString(body.propertyTitle) ? body.propertyTitle : "";
        const propertyId = isNonEmptyString(body.propertyId) ? body.propertyId : "";
        const unitId = isNonEmptyString(body.unitId) ? body.unitId : null;
        const isEntireHome = typeof body.isEntireHome === "boolean" ? body.isEntireHome : false;

        // If user is logged in, try to get phone from user profile
        if (user && !phone) {
            const { data: userData } = await supabase
                .from("users")
                .select("phone")
                .eq("id", user.id)
                .single();

            if (userData?.phone) {
                phone = userData.phone;
            }
        }

        if (!phone || !message) {
            return NextResponse.json(
                { error: "Phone and message are required" },
                { status: 400, headers: { "Cache-Control": "no-store" } }
            );
        }

        // If user is logged in and provided a phone number, update their profile
        if (user && isNonEmptyString(body.phone)) {
            const { data: userData } = await supabase
                .from("users")
                .select("phone")
                .eq("id", user.id)
                .single();

            // Only update if phone is different or not set
            if (!userData?.phone || userData.phone !== phone) {
                await supabase
                    .from("users")
                    .update({ phone, updated_at: new Date().toISOString() })
                    .eq("id", user.id);
            }
        }

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
        console.log("User ID:", user?.id || "Guest");
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
