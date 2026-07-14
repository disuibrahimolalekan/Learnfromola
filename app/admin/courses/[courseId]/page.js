"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function CourseLandingPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId;

  const [checking, setChecking] = useState(true);
  const [courseName, setCourseName] = useState("");

  useEffect(() => {
    async function load() {
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

      const { data: course } = await supabase
        .from("courses")
        .select("name")
        .eq("id", courseId)
        .maybeSingle();

      setCourseName(course?.name || "");
      setChecking(false);
    }
    load();
  }, [router, courseId]);

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
        <Link href="/admin" className="text-sm font-medium text-primary hover:underline">
          ← All Courses
        </Link>

        <h1 className="mt-4 font-display text-2xl font-bold text-text-primary">
          {courseName}
        </h1>

        <div className="mt-6 space-y-3">
          <Link
            href={`/admin/courses/${courseId}/modules`}
            className="block rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:bg-primary/5 hover:shadow-md active:bg-primary/10"
          >
            <h2 className="font-display text-base font-semibold text-text-primary">
              Modules
            </h2>
            <p className="mt-1 text-xs text-text-secondary">
              Edit module intros, chapters, and the checklist
            </p>
          </Link>

          <Link
            href={`/admin/courses/${courseId}/students`}
            className="block rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:bg-primary/5 hover:shadow-md active:bg-primary/10"
          >
            <h2 className="font-display text-base font-semibold text-text-primary">
              Student Monitoring
            </h2>
            <p className="mt-1 text-xs text-text-secondary">
              See who&apos;s purchased and how far they&apos;ve progressed
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
    }
