import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// This is the one Selar product code this deployed site currently sells.
// When admin.learnfromola.online supports adding new courses with their own
// product codes, this can become dynamic (e.g. based on subdomain); for now,
// course.learnfromola.online is a single-course site.
const COURSE_SLUG = "ai-software-builder";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const { data: course, error: courseError } = await supabaseAdmin
    .from("courses")
    .select("id")
    .eq("slug", COURSE_SLUG)
    .maybeSingle();

  if (courseError || !course) {
    console.error("check-purchase: course lookup failed:", courseError?.message);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from("purchases")
    .select("id")
    .eq("email", email)
    .eq("course_id", course.id)
    .limit(1);

  if (error) {
    console.error("check-purchase query failed:", error.message);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }

  return NextResponse.json({ purchased: Boolean(data && data.length > 0) });
                  }
