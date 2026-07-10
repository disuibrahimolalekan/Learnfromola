"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { MODULES, TOTAL_CHAPTERS } from "@/lib/courseStructure";
import ProgressBar from "@/components/ui/ProgressBar";

export default function DashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [fullName, setFullName] = useState("");
  const [completedByModule, setCompletedByModule] = useState({});

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      setFullName(session.user.user_metadata?.full_name || "");

      const { data: progressRows, error } = await supabase
        .from("progress")
        .select("module_number, chapter_number")
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Failed to load progress:", error.message);
      }

      const byModule = {};
      (progressRows || []).forEach((row) => {
        const set = byModule[row.module_number] || new Set();
        set.add(row.chapter_number);
        byModule[row.module_number] = set;
      });
      setCompletedByModule(byModule);
      setChecking(false);
    }

    load();
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

  const totalCompleted = Object.values(completedByModule).reduce(
    (sum, set) => sum + set.size,
    0
  );
  const overallPercent =
    TOTAL_CHAPTERS > 0 ? Math.round((totalCompleted / TOTAL_CHAPTERS) * 100) : 0;

  let continueTarget = null;
  for (const mod of MODULES) {
    const completedSet = completedByModule[mod.number] || new Set();
    if (completedSet.size < mod.chapterCount) {
      let nextChapter = 1;
      while (completedSet.has(nextChapter) && nextChapter <= mod.chapterCount) {
        nextChapter += 1;
      }
      continueTarget = { module: mod.number, chapter: nextChapter };
      break;
    }
  }

  return (
    <div className="min-h-screen bg-bg pb-16">
      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">
              Welcome back{fullName ? `, ${fullName.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              AI Software Builder Course
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-bg active:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Log out
          </button>
        </div>

        {/* Overall progress */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-text-primary">
              Overall progress
            </span>
            <span className="text-sm text-text-secondary">
              {totalCompleted} of {TOTAL_CHAPTERS} chapters
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar percent={overallPercent} />
          </div>

          {continueTarget ? (
            <Link
              href={`/module/${continueTarget.module}/chapter/${continueTarget.chapter}`}
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md hover:brightness-105"
            >
              Continue Learning
            </Link>
          ) : (
            <p className="mt-5 text-center text-sm font-medium text-emerald-600">
              You&apos;ve completed the entire course. 🎉
            </p>
          )}
        </div>

        {/* Vibe-coded encouragement message */}
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <p className="font-display text-base font-bold text-emerald-800">
            This entire platform was vibe-coded with AI.
          </p>
          <p className="mt-1 text-sm font-semibold text-emerald-700">
            Pay attention throughout this course, and by the end
            you&apos;ll be able to build something just like it — maybe
            even better.
          </p>
        </div>

        {/* Module list */}
        <div className="mt-6 space-y-3">
          {MODULES.map((mod) => {
            const completedSet = completedByModule[mod.number] || new Set();
            const percent =
              mod.chapterCount > 0
                ? Math.round((completedSet.size / mod.chapterCount) * 100)
                : 0;

            return (
              <Link
                key={mod.number}
                href={`/module/${mod.number}`}
                className="block rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Module {mod.number}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {completedSet.size}/{mod.chapterCount}
                  </span>
                </div>
                <h2 className="mt-1 font-display text-base font-semibold text-text-primary">
                  {mod.title}
                </h2>
                <div className="mt-3">
                  <ProgressBar percent={percent} />
                </div>
              </Link>
            );
          })}

          {/* Checklist — reference content, not a course module, so no progress bar */}
          <Link
            href="/checklist"
            className="block rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              Reference
            </span>
            <h2 className="mt-1 font-display text-base font-semibold text-text-primary">
              Security & Deployment Checklist
            </h2>
            <p className="mt-1 text-xs text-text-secondary">
              Review before and after deploying your projects
            </p>
          </Link>
        </div>

        {/* Terms & Privacy footer */}
        <div className="mt-12 space-y-6 border-t border-border pt-8 text-xs leading-relaxed text-text-secondary">
          <div>
            <h3 className="mb-2 font-display text-sm font-semibold text-text-primary">
              Terms & Conditions
            </h3>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                Access to the AI Software Builder Course is granted only to
                verified purchasers via Selar, using the same email used at
                checkout.
              </li>
              <li>
                All sales are final. As a digital product delivered
                instantly upon purchase, no refunds are offered once access
                has been granted.
              </li>
              <li>
                Course access is personal to the purchaser and may not be
                shared, resold, or transferred to another individual.
              </li>
              <li>
                Learn From Ola reserves the right to update course content
                to improve quality; core module structure will remain
                consistent.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 font-display text-sm font-semibold text-text-primary">
              Privacy Policy
            </h3>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                We collect your email, name, and password (encrypted) to
                create and manage your account.
              </li>
              <li>
                Your purchase email is verified against Selar&apos;s sales
                records solely to confirm course access — never sold or
                shared with third parties.
              </li>
              <li>
                We track your course progress (completed chapters/modules)
                to power the Continue Learning feature.
              </li>
              <li>
                We do not display third-party ads or share your data with
                advertisers.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
    }
