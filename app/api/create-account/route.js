import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isValidEmail, isValidPassword } from "@/lib/validators";

const COURSE_SLUG = "ai-software-builder";
const PURCHASE_ERROR =
  "We couldn't find a purchase with this email. Use the same email you bought the course with.";

export async function POST(request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("create-account: Supabase admin configuration is missing.");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;
  const fullName = body?.fullName?.trim();

  if (!email || !isValidEmail(email) || !isValidPassword(password || "") || !fullName) {
    return NextResponse.json({ error: "Invalid account details." }, { status: 400 });
  }

  const { data: course, error: courseError } = await supabaseAdmin
    .from("courses")
    .select("id")
    .eq("slug", COURSE_SLUG)
    .maybeSingle();

  if (courseError || !course) {
    console.error("create-account: course lookup failed:", courseError?.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const purchaseEmailPattern = email.replace(/[\\%_]/g, "\\$&");
  const { data: purchase, error: purchaseError } = await supabaseAdmin
    .from("purchases")
    .select("id")
    .ilike("email", purchaseEmailPattern)
    .eq("course_id", course.id)
    .limit(1)
    .maybeSingle();

  if (purchaseError) {
    console.error("create-account: purchase lookup failed:", purchaseError.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  if (!purchase) {
    return NextResponse.json({ error: PURCHASE_ERROR }, { status: 403 });
  }

  const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError) {
    if (createError.message.toLowerCase().includes("already been registered")) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }
    console.error("create-account: Auth user creation failed:", createError.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ userId: user.user.id }, { status: 201 });
}
