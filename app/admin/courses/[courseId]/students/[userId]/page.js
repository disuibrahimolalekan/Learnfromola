"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId;
  const userId = params.userId;

  const [checking, setChecking] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);
  const [moduleProgress, setModuleProgress] = useState([]);

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

      const [studentsResult, modulesResult, chaptersResult, progressResult] = await Promise.all([
        supabase.rpc("get_course_students", { p_course_id: courseId }),
        supabase
          .from("modules")
          .select("number, title")
          .eq("course_id", courseId)
          .order("number", { ascending: true }),
        supabase.from("chapters").select("module_number").eq("course_id", courseId),
        supabase
          .from("progress")
          .select("module_number, chapter_number")
          .eq("course_id", courseId)
          .eq("user_id", userId),
      ]);

      const match = (studentsResult.data || []).find((s) => s.user_id === userId);
      setStudentInfo(match || null);

      const totalByModule = {};
      (chaptersResult.data || []).forEach((row) => {
        totalByModule[row.module_number] = (totalByModule[row.module_number] || 0) + 1;
      });

      const completedByModule = {};
      (progressResult.data || []).forEach((row) => {
        completedByModule[row.module_number] = (completedByModule[row.module_number] || 0) + 1;
      });

      setModuleProgress(
        (modulesResult.data || []).map((m) => ({
          number: m.number,
          title: m.title,
          completed: completedByModule[m.number] || 0,
          total: totalByModule[m.number] || 0,
        }))
      );
      setChecking(false);
    }
    load();
  }, [router, courseId, userId]);

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
          href={`/admin/courses/${courseId}/students`}
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Student Monitoring
        </Link>

        <h1 className="mt-4 font-display text-2xl font-bold text-text-primary">
          {studentInfo?.full_name || studentInfo?.email || "Student"}
        </h1>
        {studentInfo?.full_name && (
          <p className="mt-1 text-sm text-text-secondary">{studentInfo.email}</p>
        )}
        {studentInfo?.purchased_at && (
          <p className="mt-1 text-xs text-text-secondary">
            Purchased {new Date(studentInfo.purchased_at).toLocaleDateString()}
          </p>
        )}

        <div className="mt-6 space-y-3">
          {moduleProgress.map((m) => (
            <div
              key={m.number}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Module {m.number}
                  </span>
                  <h2 className="mt-1 truncate font-display text-base font-semibold text-text-primary">
                    {m.title}
                  </h2>
                </div>
                <span className="flex-shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {m.completed}/{m.total}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
      }
