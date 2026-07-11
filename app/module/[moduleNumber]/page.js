"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { MODULES } from "@/lib/courseStructure";
import ProgressBar from "@/components/ui/ProgressBar";

export default function ModulePage() {
  const router = useRouter();
  const params = useParams();
  const moduleNumber = Number(params.moduleNumber);
  
  const [checking, setChecking] = useState(true);
  const [moduleRow, setModuleRow] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [completedSet, setCompletedSet] = useState(new Set());
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      // moduleInfo comes from the local course structure (chapter counts,
      // titles for the dashboard); moduleRow/chapters come from Supabase
      // (the real, editable content).
      const moduleInfo = MODULES.find((m) => m.number === moduleNumber);
      if (!moduleInfo) {
        setNotFound(true);
        setChecking(false);
        return;
      }

      const [moduleResult, chaptersResult, progressResult] = await Promise.all([
        supabase
          .from("modules")
          .select("number, title, intro_content")
          .eq("number", moduleNumber)
          .maybeSingle(),
        supabase
          .from("chapters")
          .select("chapter_number, title")
          .eq("module_number", moduleNumber)
          .order("chapter_number", { ascending: true }),
        supabase
          .from("progress")
          .select("chapter_number")
          .eq("user_id", session.user.id)
          .eq("module_number", moduleNumber),
      ]);

      if (moduleResult.error) {
        console.error("Failed to load module:", moduleResult.error.message);
      }
      if (chaptersResult.error) {
        console.error("Failed to load chapters:", chaptersResult.error.message);
      }
      if (progressResult.error) {
        console.error("Failed to load progress:", progressResult.error.message);
      }

      setModuleRow(moduleResult.data);
      setChapters(chaptersResult.data || []);
      setCompletedSet(
        new Set((progressResult.data || []).map((row) => row.chapter_number))
      );
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

  if (notFound || !moduleRow) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
        <p className="text-sm text-text-secondary">
          We couldn&apos;t find that module.
        </p>
        <Link
          href="/dashboard"
          className="rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const moduleInfo = MODULES.find((m) => m.number === moduleNumber);
  const percent =
    moduleInfo.chapterCount > 0
      ? Math.round((completedSet.size / moduleInfo.chapterCount) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-bg pb-16">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            Module {moduleRow.number}
          </span>
          <h1 className="mt-1 font-display text-2xl font-bold text-text-primary">
            {moduleRow.title}
          </h1>

          <div className="mt-4">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium text-text-primary">Progress</span>
              <span className="text-text-secondary">
                {completedSet.size}/{moduleInfo.chapterCount} chapters
              </span>
            </div>
            <div className="mt-2">
              <ProgressBar percent={percent} />
            </div>
          </div>
        </div>

        {/* Chapter list — Introduction (if this module has one) appears first */}
        <div className="mt-8 space-y-3">
          {moduleRow.intro_content && (
            <Link
              href={`/module/${moduleNumber}/intro`}
              className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm transition hover:border-primary/50 hover:shadow-md"
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                📖
              </span>
              <span className="text-sm font-semibold text-text-primary">
                Introduction (Read First)
              </span>
            </Link>
          )}
          {chapters.map((chapter) => {
            const isComplete = completedSet.has(chapter.chapter_number);
            return (
              <Link
                key={chapter.chapter_number}
                href={`/module/${moduleNumber}/chapter/${chapter.chapter_number}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md"
              >
                <span
                  className={
                    isComplete
                      ? "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white"
                      : "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-text-secondary"
                  }
                >
                  {isComplete ? "✓" : chapter.chapter_number}
                </span>
                <span className="text-sm font-medium text-text-primary">
                  {chapter.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
      }
