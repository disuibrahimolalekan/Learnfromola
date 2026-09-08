import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Verify Selar webhook signature using HMAC-SHA256.
 * Selar sends the signature in the 'X-Selar-Signature' header.
 * This is for calls coming directly from Selar in the future.
 */
function verifyHmacSignature(rawBody, signature) {
  const secret = process.env.SELAR_WEBHOOK_SECRET;
  if (!secret || typeof signature !== "string") return false;

  const normalizedSignature = signature.trim().toLowerCase();
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const provided = Buffer.from(normalizedSignature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return (
    provided.length === expectedBuffer.length &&
    crypto.timingSafeEqual(provided, expectedBuffer)
  );
}

/**
 * Verify shared-secret query param.
 * This is the auth method used by the Google Apps Script relay, which
 * reads new rows from the purchases Sheet and forwards them here — it's
 * not Selar itself calling us, so it can't produce a real Selar HMAC.
 */
function verifyQuerySecret(request) {
  const secret = process.env.SELAR_WEBHOOK_SECRET;
  const provided = request.nextUrl.searchParams.get("secret");
  if (!secret || typeof provided !== "string") return false;

  const secretBuf = Buffer.from(secret.trim());
  const providedBuf = Buffer.from(provided.trim());
  if (!secretBuf.length || secretBuf.length !== providedBuf.length) return false;

  return crypto.timingSafeEqual(secretBuf, providedBuf);
}

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
  if (!process.env.SELAR_WEBHOOK_SECRET) {
    console.error("Selar webhook is not configured: SELAR_WEBHOOK_SECRET is missing.");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const signature = request.headers.get("x-selar-signature");

  // Read raw body first (needed for HMAC verification)
  const rawBody = await request.text().catch(() => "");

  // Accept either a valid Selar HMAC signature OR a valid shared-secret
  // query param. The query param covers the Sheets relay path; HMAC
  // covers a possible future direct-from-Selar path.
  const isAuthorized =
    verifyHmacSignature(rawBody, signature) || verifyQuerySecret(request);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  // Parse JSON from raw body
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  console.log("Selar webhook payload:", JSON.stringify(body));

  const email = extractBuyerEmail(body);
  const productCode = extractProductCode(body);

  if (!email) {
    console.warn("Selar webhook: could not find a buyer email in payload.");
    return NextResponse.json(
      { error: "No email found in payload", received: body },
      { status: 200 }
    );
  }

  if (!productCode) {
    console.warn("Selar webhook: no product_code found in payload.");
    return NextResponse.json(
      { error: "No product_code found in payload", received: body },
      { status: 200 }
    );
  }

  // Every purchase now has to belong to a specific course. Look up which
  // course this product code maps to instead of assuming there's only one.
  const { data: course, error: courseError } = await supabaseAdmin
    .from("courses")
    .select("id, name")
    .eq("selar_product_code", productCode)
    .maybeSingle();

  if (courseError) {
    console.error("Failed to look up course:", courseError.message);
    return NextResponse.json({ error: courseError.message }, { status: 500 });
  }

  if (!course) {
    // A sale came in for a product code that isn't registered to any course
    // yet. Log it clearly so it's never silently lost, but don't insert a
    // broken purchase row.
    console.warn(
      `Selar webhook: no course found for product_code "${productCode}". Purchase not recorded.`
    );
    return NextResponse.json(
      { error: `No course matches product_code ${productCode}`, received: body },
      { status: 200 }
    );
  }

  const { error } = await supabaseAdmin.from("purchases").insert({
    email: email.trim().toLowerCase(),
    full_name: extractBuyerName(body),
    selar_order_id: extractOrderId(body),
    product_code: productCode,
    course_id: course.id,
  });

  if (error) {
    // The database unique constraint makes Selar retries idempotent. Treat a
    // duplicate as successfully received so Selar does not keep retrying it.
    if (error.code === "23505") {
      console.log(`Duplicate purchase webhook acknowledged for ${email}`);
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }
    console.error("Failed to record purchase:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`Purchase recorded for course "${course.name}"`);
  return NextResponse.json({ received: true }, { status: 200 });
}
