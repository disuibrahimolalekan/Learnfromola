import { redirect } from "next/navigation";

// Root route has no content of its own yet — it hands off to the
// login page. Once the dashboard exists, this will check for a
// logged-in session and redirect to /dashboard instead.
export default function RootPage() {
  redirect("/login");
}
