"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabaseClient";
import { formatQuotes } from "@/lib/formatContent";
import { getCurrentCourseId } from "@/lib/currentCourse";

export default function ModuleIntroPage() {
  const router = useRouter();
  const params = useParams();
  const moduleNumber = Number(params.moduleNumber);

  const [checking, setChecking] = useState(true);
  const [moduleRow, setModuleRow] = useState(null);

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const courseId = await getCurrentCourseId();
      if (!courseId) {
        setChecking(false);
        return;
      }

      const { data, error } = await supabase
        .from("modules")
        .select("number, title, intro_content")
        .eq("course_id", courseId)
        .eq("number", moduleNumber)
        .maybeSingle();

      if (error) {
        console.error("Failed to load module intro:", error.message);
      }

      setModuleRow(data);
      setChecking(false);
    }

    load();
  }, [moduleNumber, router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm text-text-secondary">Loading…</p>
      </div>
    );
  }

  if (!moduleRow || !moduleRow.intro_content) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
        <p className="text-sm text-text-secondary">
          This module doesn&apos;t have an introduction.
        </p>
        <Link
          href={`/module/${moduleNumber}`}
          className="rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          Back to Module
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-28">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href={`/module/${moduleNumber}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to Module {moduleNumber}
        </Link>

        <div className="markdown-content mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <ReactMarkdown>{formatQuotes(moduleRow.intro_content)}</ReactMarkdown>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-stretch justify-between gap-2">
          <Link
            href="/dashboard"
            className="flex flex-1 items-center justify-center whitespace-nowrap rounded-xl border border-border bg-card px-3 py-2.5 text-center text-sm font-medium text-text-primary transition hover:bg-primary/5 active:bg-primary/10"
          >
            Home
          </Link>

          <Link
            href={`/module/${moduleNumber}/chapter/1`}
            className="flex flex-1 items-center justify-center whitespace-nowrap rounded-xl bg-gradient-to-r from-primary to-secondary px-3 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:shadow-md hover:brightness-105"
          >
            Next →
          </Link>
        </div>
      </div>
    </div>
  );
}
