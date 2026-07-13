"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabaseClient";
import { formatQuotes } from "@/lib/formatContent";

export default function ChecklistPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [page, setPage] = useState(null);

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("pages")
        .select("title, content")
        .eq("slug", "checklist")
        .maybeSingle();

      if (error) {
        console.error("Failed to load checklist:", error.message);
      }

      setPage(data);
      setChecking(false);
    }

    load();
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
        <Link
          href="/dashboard"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to Dashboard
        </Link>

        {page ? (
          <>
            <h1 className="mt-4 font-display text-2xl font-bold text-text-primary">
              {page.title}
            </h1>
            <div className="markdown-content mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <ReactMarkdown>{formatQuotes(page.content)}</ReactMarkdown>
            </div>
          </>
        ) : (
          <p className="mt-6 text-sm text-text-secondary">
            We couldn&apos;t load the checklist right now.
          </p>
        )}
      </div>
    </div>
  );
}
