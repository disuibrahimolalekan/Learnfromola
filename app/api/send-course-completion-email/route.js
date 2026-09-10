import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendBrevoEmail } from "@/lib/brevo";

export async function POST(request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("send-course-completion-email: Supabase admin configuration is missing.");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const { userId, email, firstName } = body || {};

  if (!userId || !email) {
    return NextResponse.json({ error: "User ID and email are required." }, { status: 400 });
  }

  // Check if completion email has already been sent for this user
  const { data: existing, error: checkError } = await supabaseAdmin
    .from("completion_emails_sent")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (checkError) {
    console.error("send-course-completion-email: error checking existing record:", checkError.message);
    return NextResponse.json({ error: "Tracking error" }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ message: "Completion email already sent." }, { status: 200 });
  }

  // Insert tracking record first
  const { error: insertError } = await supabaseAdmin
    .from("completion_emails_sent")
    .insert({ user_id: userId });

  if (insertError) {
    console.error("send-course-completion-email: error inserting tracking record:", insertError.message);
    return NextResponse.json({ error: "Failed to track email" }, { status: 500 });
  }

  // Send the email
  const result = await sendBrevoEmail({
    toEmail: email,
    toName: firstName,
    subject: "You finished it. All 63 chapters.",
    textContent: [
      `Hey ${firstName},`,
      "You did it. All 6 modules, all 63 chapters, done.",
      "You went from understanding what software even is, to planning with AI instead of just prompting blindly, to shipping a real capstone project with proper security and deployment behind it. That's not a small thing. Most people who start a course like this never finish it. You did.",
      "So, what are you building next?",
      "If you're thinking about turning this into income, freelancing, or client work, the AI Freelance Playbook picks up exactly where this leaves off",
      "Either way, go build something",
      "Learn From Ola",
    ].join("\n"),
    htmlContent: [
      `<p>Hey ${firstName},</p>`,
      "<p>You did it. All 6 modules, all 63 chapters, done.</p>",
      "<p>You went from understanding what software even is, to planning with AI instead of just prompting blindly, to shipping a real capstone project with proper security and deployment behind it. That's not a small thing. Most people who start a course like this never finish it. You did.</p>",
      "<p>So, what are you building next?</p>",
      "<p>If you're thinking about turning this into income, freelancing, or client work, the AI Freelance Playbook picks up exactly where this leaves off</p>",
      "<p>Either way, go build something</p>",
      "<p>Learn From Ola</p>",
    ].join(""),
  });

  if (result.error) {
    console.error("send-course-completion-email: Brevo error:", result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ message: "Completion email sent." }, { status: 200 });
}
