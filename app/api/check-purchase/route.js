import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const COURSE_PRODUCT_CODE = "8713g4z88e";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("purchases")
    .select("id")
    .eq("email", email)
    .eq("product_code", COURSE_PRODUCT_CODE)
    .limit(1);

  if (error) {
    console.error("check-purchase query failed:", error.message);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }

  return NextResponse.json({ purchased: Boolean(data && data.length > 0) });
}
