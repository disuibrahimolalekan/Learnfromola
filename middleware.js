import { NextResponse } from "next/server";

// Simple in-memory rate limit store (key -> { count, resetAt })
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 20; // 20 requests per window

function getClientIP(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function checkRateLimit(key) {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || now - existing.resetAt > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, resetAt: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (existing.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - existing.count };
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.resetAt > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Routes requests based on which domain they arrive on:
// - admin.learnfromola.online  → served from the app/admin/ folder
// - course.learnfromola.online → app/admin/ is completely unreachable,
//   even if someone guesses the URL directly
export function middleware(request) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  // This host-header check assumes the proxy provides a trusted Host header;
  // behind a different proxy, a spoofed header could bypass host routing.
  const isAdminHost = hostname.startsWith("admin.");

  // Selar retries must reach the handler so signed purchases are not lost to
  // the browser/API traffic budget.
  if (url.pathname.startsWith("/api/") && url.pathname !== "/api/selar-webhook") {
    const ip = getClientIP(request);
    const { allowed, remaining } = checkRateLimit(`api:${ip}`);

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "content-type": "application/json" } }
      );
    }
  }

  if (isAdminHost) {
    // Every path visitors see on the admin subdomain (e.g. "/", "/login")
    // is invisibly served from the matching app/admin/... page.
    if (!url.pathname.startsWith("/admin")) {
      url.pathname = `/admin${url.pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // On the student domain, block the /admin folder entirely.
  if (url.pathname.startsWith("/admin")) {
    url.pathname = "/404";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
