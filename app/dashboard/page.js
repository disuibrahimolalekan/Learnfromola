"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      setEmail(session.user.email);
      setChecking(false);
    }

    checkSession();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm text-text-secondary">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-6 text-center">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Dashboard coming soon
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          You&apos;re logged in as <span className="font-medium text-text-primary">{email}</span>.
          The real dashboard — your progress, modules, and Continue Learning — is being built next.
        </p>

        <button
          onClick={handleLogout}
          className="mt-6 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-bg"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
