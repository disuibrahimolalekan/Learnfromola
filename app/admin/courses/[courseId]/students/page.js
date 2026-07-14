"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function StudentMonitoringPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId;

  const [checking, setChecking] = useState(true);
  const [courseName, setCourseName] = useState("");
  const [students, setStudents] = useState([]);
  const [totalChapters, setTotalChapters] = useState(0);

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

      const [courseResult, chaptersResult, studentsResult] = await Promise.all([
        supabase.from("courses").select("name").eq("id", courseId).maybeSingle(),
        supabase.from("chapters").select("id").eq("course_id", courseId),
        supabase.rpc("get_course_students", { p_course_id: courseId }),
      ]);

      setCourseName(courseResult.data?.name || "");
      setTotalChapters((chaptersResult.data || []).length);

      if (studentsResult.error) {
        console.error("Failed to load students:", studentsResult.error.message);
      }
      setStudents(studentsResult.data || []);
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
        <Link href={`/admin/courses/${courseId}`} className="text-sm font-medium text-primary hover:underline">
          ← {courseName}
        </Link>

        <h1 className="mt-4 font-display text-2xl font-bold text-text-primary">
          Student Monitoring
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {students.length} {students.length === 1 ? "student" : "students"}
        </p>

        <div className="mt-6 space-y-3">
          {students.length === 0 ? (
            <p className="text-sm text-text-secondary">No purchases yet for this course.</p>
          ) : (
            students.map((s) => {
              const percent =
                totalChapters > 0
                  ? Math.round((Number(s.completed_chapters) / totalChapters) * 100)
                  : 0;
              return (
                <Link
                  key={s.user_id || s.email}
                  href={s.user_id ? `/admin/courses/${courseId}/students/${s.user_id}` : "#"}
                  className={`block rounded-2xl border border-border bg-card p-5 shadow-sm transition ${
                    s.user_id
                      ? "hover:border-primary/40 hover:bg-primary/5 hover:shadow-md active:bg-primary/10"
                      : "opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-base font-semibold text-text-primary">
                        {s.full_name || s.email}
                      </h2>
                      <p className="mt-1 text-xs text-text-secondary">{s.email}</p>
                      {!s.user_id && (
                        <p className="mt-1 text-xs text-accent">
                          No account created yet
                        </p>
                      )}
                    </div>
                    <span className="flex-shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {percent}%
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
    }
