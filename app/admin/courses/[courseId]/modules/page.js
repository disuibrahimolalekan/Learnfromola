"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import UndoToast from "@/components/admin/UndoToast";
import { getPendingUndo, clearPendingUndo } from "@/lib/undoStore";

export default function AdminModulesPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId;

  const [checking, setChecking] = useState(true);
  const [courseName, setCourseName] = useState("");
  const [modules, setModules] = useState([]);
  const [creating, setCreating] = useState(false);
  const [undo, setUndo] = useState(null);

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

      const [courseResult, modulesResult, chaptersResult] = await Promise.all([
        supabase.from("courses").select("name").eq("id", courseId).maybeSingle(),
        supabase
          .from("modules")
          .select("number, title")
          .eq("course_id", courseId)
          .order("number", { ascending: true }),
        supabase.from("chapters").select("module_number").eq("course_id", courseId),
      ]);

      setCourseName(courseResult.data?.name || "");

      const countByModule = {};
      (chaptersResult.data || []).forEach((row) => {
        countByModule[row.module_number] = (countByModule[row.module_number] || 0) + 1;
      });

      setModules(
        (modulesResult.data || []).map((m) => ({
          number: m.number,
          title: m.title,
          chapterCount: countByModule[m.number] || 0,
        }))
      );
      setChecking(false);

      const pending = getPendingUndo();
      if (pending?.type === "module" && pending.courseId === courseId) {
        setUndo(pending);
      }
    }
    load();
  }, [router, courseId]);

  async function handleUndoModule() {
    if (!undo) return;

    const { data: restoredModule, error: moduleError } = await supabase
      .from("modules")
      .insert({
        course_id: undo.courseId,
        number: undo.module.number,
        title: undo.module.title,
        intro_content: undo.module.intro_content,
      })
      .select("id")
      .single();

    if (moduleError || !restoredModule) {
      alert(`Failed to restore module: ${moduleError?.message || "module was not created"}`);
      return;
    }

    const chapters = (undo.chapters || []).map((chapter) => ({
      course_id: undo.courseId,
      module_id: restoredModule.id,
      module_number: undo.module.number,
      chapter_number: chapter.chapter_number,
      title: chapter.title,
      content: chapter.content,
      video_url: chapter.video_url,
    }));

    if (chapters.length > 0) {
      const { error: chaptersError } = await supabase.from("chapters").insert(chapters);
      if (chaptersError) {
        await supabase.from("modules").delete().eq("id", restoredModule.id);
        alert(`Failed to restore module chapters: ${chaptersError.message}`);
        return;
      }
    }

    clearPendingUndo();
    setUndo(null);
    window.location.reload();
  }

  async function handleAddModule() {
    const title = window.prompt("Title for the new module:");
    if (!title || !title.trim()) return;

    setCreating(true);
    const nextNumber =
      modules.length > 0 ? Math.max(...modules.map((m) => m.number)) + 1 : 1;

    const { error } = await supabase.from("modules").insert({
      course_id: courseId,
      number: nextNumber,
      title: title.trim(),
      intro_content: null,
    });
    setCreating(false);

    if (error) {
      alert(`Failed to create module: ${error.message}`);
      return;
    }

    setModules((prev) => [...prev, { number: nextNumber, title: title.trim(), chapterCount: 0 }]);
  }

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

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              {courseName}
            </span>
            <h1 className="mt-1 font-display text-2xl font-bold text-text-primary">
              Manage Content
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Select a module to edit its intro or chapters.
            </p>
          </div>
          <button
            onClick={handleAddModule}
            disabled={creating}
            className="flex-shrink-0 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-60"
          >
            {creating ? "Adding…" : "+ New Module"}
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {modules.map((mod) => (
            <Link
              key={mod.number}
              href={`/admin/courses/${courseId}/modules/${mod.number}`}
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

          {/* Checklist lives here as the final item after all modules,
              not as a standalone admin link outside the course. */}
          <Link
            href={`/admin/courses/${courseId}/checklist`}
            className="block rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:bg-primary/5 hover:shadow-md active:bg-primary/10"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-accent">
              Final Item
            </span>
            <h2 className="mt-1 font-display text-base font-semibold text-text-primary">
              Checklist
            </h2>
            <p className="mt-1 text-xs text-text-secondary">
              Security &amp; Deployment Checklist page
            </p>
          </Link>
        </div>
      </div>
      {undo && (
        <UndoToast
          message={`Module ${undo.module.number} deleted.`}
          expiresAt={undo.expiresAt}
          onUndo={handleUndoModule}
          onExpire={() => {
            clearPendingUndo();
            setUndo(null);
          }}
        />
      )}
    </div>
  );
}
