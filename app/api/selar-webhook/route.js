import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function extractBuyerEmail(body) {
  return (
    body?.email ||
    body?.buyer_email ||
    body?.customer_email ||
    body?.data?.email ||
    body?.data?.buyer_email ||
    body?.data?.customer?.email ||
    body?.customer?.email ||
    null
  );
}

function extractBuyerName(body) {
  return (
    body?.full_name ||
    body?.buyer_name ||
    body?.customer_name ||
    body?.data?.full_name ||
    body?.data?.customer?.name ||
    body?.customer?.name ||
    null
  );
}

function extractOrderId(body) {
  return (
    body?.order_id ||
    body?.id ||
    body?.data?.order_id ||
    body?.data?.id ||
    null
  );
}

function extractProductCode(body) {
  return body?.product_code || body?.data?.product_code || null;
}

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const providedSecret = searchParams.get("secret");
  const expectedSecret = process.env.SELAR_WEBHOOK_SECRET;

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  console.log("Selar webhook payload:", JSON.stringify(body));

  const email = extractBuyerEmail(body);

  if (!email) {
    console.warn("Selar webhook: could not find a buyer email in payload.");
    return NextResponse.json(
      { error: "No email found in payload", received: body },
      { status: 200 }
    );
  }

  const { error } = await supabaseAdmin.from("purchases").insert({
    email: email.trim().toLowerCase(),
    full_name: extractBuyerName(body),
    selar_order_id: extractOrderId(body),
    product_code: extractProductCode(body),
  });

  if (error) {
    console.error("Failed to record purchase:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
