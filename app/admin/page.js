"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    async function verifyAdmin() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: adminRow } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!adminRow) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      setAdminEmail(session.user.email);
      setChecking(false);
    }

    verifyAdmin();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm text-text-secondary">Verifying access…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              Admin Dashboard
            </span>
            <h1 className="mt-1 font-display text-2xl font-bold text-text-primary">
              Welcome, {adminEmail}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-primary/5 active:bg-primary/10"
          >
            Sign Out
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-text-secondary">
            Login and access control are working. Content editing and student
            monitoring screens are coming next.
          </p>
        </div>
      </div>
    </div>
  );
    }
