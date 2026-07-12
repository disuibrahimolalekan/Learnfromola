import { NextResponse } from "next/server";

// Routes requests based on which domain they arrive on:
// - admin.learnfromola.online  → served from the app/admin/ folder
// - course.learnfromola.online → app/admin/ is completely unreachable,
//   even if someone guesses the URL directly
export function middleware(request) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const isAdminHost = hostname.startsWith("admin.");

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
