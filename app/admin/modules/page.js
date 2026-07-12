"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { MODULES } from "@/lib/courseStructure";

export default function AdminModulesPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function verify() {
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
      setChecking(false);
    }
    verify();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm text-text-secondary">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-16">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link href="/" className="text-sm font-medium text-primary hover:underline">
          ← Admin Dashboard
        </Link>

        <h1 className="mt-4 font-display text-2xl font-bold text-text-primary">
          Manage Content
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Select a module to edit its intro or chapters.
        </p>

        <div className="mt-6 space-y-3">
          {MODULES.map((mod) => (
            <Link
              key={mod.number}
              href={`/admin/modules/${mod.number}`}
              className="block rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:bg-primary/5 hover:shadow-md active:bg-primary/10"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                Module {mod.number}
              </span>
              <h2 className="mt-1 font-display text-base font-semibold text-text-primary">
                {mod.title}
              </h2>
              <p className="mt-1 text-xs text-text-secondary">
                {mod.chapterCount} chapters
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
    }
