"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import UndoToast from "@/components/admin/UndoToast";
import { setPendingUndo, getPendingUndo, clearPendingUndo } from "@/lib/undoStore";

export default function AdminModuleEditPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId;
  const moduleNumber = Number(params.moduleNumber);

  const [checking, setChecking] = useState(true);
  const [title, setTitle] = useState("");
  const [introContent, setIntroContent] = useState("");
  const [hasIntro, setHasIntro] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [deleting, setDeleting] = useState(false);
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

      const [moduleResult, chaptersResult] = await Promise.all([
        supabase
          .from("modules")
          .select("title, intro_content")
          .eq("course_id", courseId)
          .eq("number", moduleNumber)
          .maybeSingle(),
        supabase
          .from("chapters")
          .select("chapter_number, title")
          .eq("course_id", courseId)
          .eq("module_number", moduleNumber)
          .order("chapter_number", { ascending: true }),
      ]);

      setTitle(moduleResult.data?.title || "");
      setIntroContent(moduleResult.data?.intro_content || "");
      setHasIntro(Boolean(moduleResult.data?.intro_content));
      setChapters(chaptersResult.data || []);
      setChecking(false);

      // Was a chapter just deleted, sending us back here? Show its Undo toast.
      const pending = getPendingUndo();
      if (
        pending &&
        pending.type === "chapter" &&
        pending.courseId === courseId &&
        pending.moduleNumber === moduleNumber
      ) {
        setUndo(pending);
      }
    }
    load();
  }, [moduleNumber, courseId, router]);

  async function handleSaveTitle() {
    setSaving(true);
    setSaveMessage("");
    const { error } = await supabase
      .from("modules")
      .update({ title })
      .eq("course_id", courseId)
      .eq("number", moduleNumber);
    setSaving(false);
    setSaveMessage(error ? `Error: ${error.message}` : "Saved successfully.");
  }

  async function handleDeleteModule() {
    const confirmed = window.confirm(
      `Delete Module ${moduleNumber} — "${title}"?\n\nThis will permanently delete this module AND all ${chapters.length} of its chapters. You'll have 30 seconds to undo — after that, it's gone for good.`
    );
    if (!confirmed) return;

    setDeleting(true);

    // Grab full chapter data (not just title) before deleting, so Undo
    // can restore everything — content and video links included.
    const { data: fullChapters } = await supabase
      .from("chapters")
      .select("chapter_number, title, content, video_url")
      .eq("course_id", courseId)
      .eq("module_number", moduleNumber);

    const { error: chaptersError } = await supabase
      .from("chapters")
      .delete()
      .eq("course_id", courseId)
      .eq("module_number", moduleNumber);

    if (chaptersError) {
      setDeleting(false);
      alert(`Failed to delete chapters: ${chaptersError.message}`);
      return;
    }

    const { error: moduleError } = await supabase
      .from("modules")
      .delete()
      .eq("course_id", courseId)
      .eq("number", moduleNumber);

    setDeleting(false);

    if (moduleError) {
      alert(`Failed to delete module: ${moduleError.message}`);
      return;
    }

    setPendingUndo({
      type: "module",
      courseId,
      module: { number: moduleNumber, title, intro_content: introContent },
      chapters: fullChapters || [],
    });

    router.replace(`/admin/courses/${courseId}/modules`);
  }

  async function handleUndoChapter() {
    if (!undo) return;

    const { data: moduleRow } = await supabase
      .from("modules")
      .select("id")
      .eq("course_id", courseId)
      .eq("number", moduleNumber)
      .maybeSingle();

    const { error } = await supabase.from("chapters").insert({
      course_id: courseId,
      module_id: moduleRow?.id,
      module_number: moduleNumber,
      chapter_number: undo.chapter.chapter_number,
      title: undo.chapter.title,
      content: undo.chapter.content,
      video_url: undo.chapter.video_url,
    });

    if (error) {
      alert(`Failed to restore chapter: ${error.message}`);
      return;
    }

    clearPendingUndo();
    setUndo(null);
    window.location.reload();
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
        <Link
          href={`/admin/courses/${courseId}/modules`}
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Manage Content
        </Link>

        <h1 className="mt-4 font-display text-2xl font-bold text-text-primary">
          Module {moduleNumber}
        </h1>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <label className="mb-1 block text-sm font-medium text-text-primary">
            Module Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
          <button
            onClick={handleSaveTitle}
            disabled={saving}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md hover:brightness-105 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Title"}
          </button>
          {saveMessage && (
            <p className="mt-2 text-sm text-text-secondary">{saveMessage}</p>
          )}
        </div>

        {/* Module Introduction now has its own editor, same as a chapter does */}
        <Link
          href={`/admin/courses/${courseId}/modules/${moduleNumber}/intro`}
          className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:bg-primary/5 hover:shadow-md active:bg-primary/10"
        >
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-text-secondary">
            ✎
          </span>
          <span className="text-sm font-medium text-text-primary">
            Module Introduction {hasIntro ? "" : "(empty)"}
          </span>
        </Link>

        <div className="mt-8 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Chapters
          </h2>
          <button
            onClick={async () => {
              const chapterTitle = window.prompt("Title for the new chapter:");
              if (!chapterTitle || !chapterTitle.trim()) return;

              const { data: moduleData } = await supabase
                .from("modules")
                .select("id")
                .eq("course_id", courseId)
                .eq("number", moduleNumber)
                .maybeSingle();

              if (!moduleData) {
                alert("Could not find this module.");
                return;
              }

              const nextChapterNumber =
                chapters.length > 0
                  ? Math.max(...chapters.map((c) => c.chapter_number)) + 1
                  : 1;

              const { error } = await supabase.from("chapters").insert({
                course_id: courseId,
                module_id: moduleData.id,
                module_number: moduleNumber,
                chapter_number: nextChapterNumber,
                title: chapterTitle.trim(),
                content: "",
                video_url: null,
              });

              if (error) {
                alert(`Failed to create chapter: ${error.message}`);
                return;
              }

              setChapters((prev) => [
                ...prev,
                { chapter_number: nextChapterNumber, title: chapterTitle.trim() },
              ]);
            }}
            className="flex-shrink-0 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2 text-xs font-semibold text-white shadow-sm"
          >
            + New Chapter
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {chapters.map((ch) => (
            <Link
              key={ch.chapter_number}
              href={`/admin/courses/${courseId}/modules/${moduleNumber}/chapter/${ch.chapter_number}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:bg-primary/5 hover:shadow-md active:bg-primary/10"
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-text-secondary">
                {ch.chapter_number}
              </span>
              <span className="text-sm font-medium text-text-primary">
                {ch.title}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
          <h3 className="font-display text-sm font-semibold text-red-800">
            Danger Zone
          </h3>
          <p className="mt-1 text-xs text-red-700">
            Deleting this module also deletes all {chapters.length} of its
            chapters.
          </p>
          <button
            onClick={handleDeleteModule}
            disabled={deleting}
            className="mt-3 w-full rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete This Module"}
          </button>
        </div>
      </div>

      {undo && (
        <UndoToast
          message={`Chapter ${undo.chapter.chapter_number} deleted.`}
          expiresAt={undo.expiresAt}
          onUndo={handleUndoChapter}
          onExpire={() => {
            clearPendingUndo();
            setUndo(null);
          }}
        />
      )}
    </div>
  );
        }
