import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      name: string;
      email: string;
      subject: string;
      message: string;
    };

    const { name, email, subject, message } = body;

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const apiKey   = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!apiKey || !adminEmail) {
      return NextResponse.json({ error: "Email service not configured on server" }, { status: 503 });
    }

    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from: "RoadPulse Contact <onboarding@resend.dev>",
      to: adminEmail,
      replyTo: email,
      subject: `[RoadPulse Contact] ${subject}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
          <div style="background:#1e40af;padding:24px 28px">
            <h2 style="color:#fff;margin:0;font-size:18px">RoadPulse — New Contact Message</h2>
            <p style="color:#93c5fd;margin:4px 0 0;font-size:13px">TN Highway Department</p>
          </div>
          <div style="padding:28px;background:#fff">
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:8px 0;color:#64748b;width:100px">From</td><td style="padding:8px 0;font-weight:600">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#2563eb">${email}</a></td></tr>
              <tr><td style="padding:8px 0;color:#64748b">Subject</td><td style="padding:8px 0;font-weight:600">${subject}</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
            <p style="color:#64748b;font-size:13px;margin:0 0 8px">Message</p>
            <div style="background:#f8fafc;border-radius:8px;padding:16px;font-size:14px;line-height:1.7;color:#1e293b;white-space:pre-wrap">${message}</div>
          </div>
          <div style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:12px;color:#94a3b8">Reply directly to this email to respond to ${name}.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("[contact] Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[contact] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
