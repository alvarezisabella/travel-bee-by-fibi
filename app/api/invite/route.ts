import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const { email, tripId, inviterId } = await req.json();

    if (!email || !tripId || !inviterId) {
      return NextResponse.json(
        { error: "Missing email, tripId, or inviterId" },
        { status: 400 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY!);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", inviterId)
      .single();

    if (profileError) {
      console.error("Profile lookup error:", profileError);
    }

    const inviterName =
      profile?.username ||
      "A friend";

    const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL}/accept-invite?tripId=${tripId}&email=${email}`;

    const result = await resend.emails.send({
      from: "TravelBee<travelbee@travelbeebyfibi.com>",
      to: email,
      subject: `${inviterName} invited you to a trip!`,
      html: `
        <h2>You're invited 🎉</h2>
        <p>${inviterName} invited you to a trip.</p>
        <a href="${inviteLink}">View Invite</a>
      `,
    });

    console.log("Resend success:", result);

    if (!result || result.error) {
      return NextResponse.json(
        { error: result?.error?.message || "Email failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Invite sent",
    });
  } catch (err: any) {
    console.error("Invite error:", err);

    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}