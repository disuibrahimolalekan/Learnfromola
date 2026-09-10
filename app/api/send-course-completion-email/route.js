import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendBrevoEmail } from "@/lib/brevo";

export async function POST(request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("send-course-completion-email: Supabase admin configuration is missing.");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const { userId, courseId, email, firstName } = body || {};

  if (!userId || !courseId || !email) {
    return NextResponse.json({ error: "User ID, course ID, and email are required." }, { status: 400 });
  }

  // Attempt to insert a tracking record. The unique constraint on
  // (user_id, course_id) guarantees this only succeeds once per user per course.
  // If the insert fails due to the unique constraint being violated, we treat
  // that as proof the email was already sent and return success without
  // sending again. This handles race conditions correctly.
  const { error: insertError } = await supabaseAdmin
    .from("completion_emails_sent")
    .insert({ user_id: userId, course_id: courseId });

  if (insertError) {
    // Check if it's a unique constraint violation (23505 is PostgreSQL's unique violation code)
    if (insertError.code === "23505") {
      // Email was already sent and tracked — this is expected, not an error
      return NextResponse.json({ message: "Completion email already sent." }, { status: 200 });
    }

    // Any other database error
    console.error("send-course-completion-email: error inserting tracking record:", insertError.message);
    return NextResponse.json({ error: "Failed to track email" }, { status: 500 });
  }

  // Insert succeeded — this is the first time, so send the email
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
      '<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">',
      `<p>Hey ${firstName},</p>`,
      "<p>You did it. All 6 modules, all 63 chapters, done.</p>",
      "<p>You went from understanding what software even is, to planning with AI instead of just prompting blindly, to shipping a real capstone project with proper security and deployment behind it. That's not a small thing. Most people who start a course like this never finish it. You did.</p>",
      "<p>So, what are you building next?</p>",
      "<p>If you're thinking about turning this into income, freelancing, or client work, the AI Freelance Playbook picks up exactly where this leaves off</p>",
      "<p>Either way, go build something</p>",
      '<div style="text-align: center; margin: 30px 0;">',
      '<a href="https://selar.com/ai-freelance-playbook" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Click to get the AI Freelance Playbook</a>',
      "</div>",
      "<p>Learn From Ola</p>",
      "</div>",
    ].join(""),
  });

  if (result.error) {
    console.error("send-course-completion-email: Brevo error:", result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ message: "Completion email sent." }, { status: 200 });
}
