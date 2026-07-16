"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ContentPreview from "@/components/admin/ContentPreview";
import { normalizeMediaSpacing } from "@/lib/youtube";
import { setPendingUndo } from "@/lib/undoStore";

export default function AdminChapterEditPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId;
  const moduleNumber = Number(params.moduleNumber);
  const chapterNumber = Number(params.chapterNumber);

  const [checking, setChecking] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  // "read" (default, looks exactly like the student page) -> "edit" -> "preview"
  const [viewMode, setViewMode] = useState("read");
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

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

      const { data } = await supabase
        .from("chapters")
        .select("title, content, video_url")
        .eq("course_id", courseId)
        .eq("module_number", moduleNumber)
        .eq("chapter_number", chapterNumber)
        .maybeSingle();

      setTitle(data?.title || "");
      setContent(data?.content || "");
      setVideoUrl(data?.video_url || "");
      setChecking(false);
    }
    load();
  }, [courseId, moduleNumber, chapterNumber, router]);

  async function handleSave() {
    setSaving(true);
    setSaveMessage("");
    const cleanContent = normalizeMediaSpacing(content);
    const { error } = await supabase
      .from("chapters")
      .update({ title, content: cleanContent, video_url: videoUrl || null })
      .eq("course_id", courseId)
      .eq("module_number", moduleNumber)
      .eq("chapter_number", chapterNumber);
    setSaving(false);

    if (error) {
      setSaveMessage(`Error: ${error.message}`);
      return;
    }

    setContent(cleanContent);
    setExpanded(false);
    setViewMode("read"); // back to the clean reading view after saving
  }

  async function handleDeleteChapter() {
    const confirmed = window.confirm(
      `Delete Chapter ${chapterNumber} — "${title}"?\n\nYou'll have 30 seconds to undo — after that, it's gone for good.`
    );
    if (!confirmed) return;

    setDeleting(true);
    const { error } = await supabase
      .from("chapters")
      .delete()
      .eq("course_id", courseId)
      .eq("module_number", moduleNumber)
      .eq("chapter_number", chapterNumber);
    setDeleting(false);

    if (error) {
      alert(`Failed to delete chapter: ${error.message}`);
      return;
    }

    setPendingUndo({
      type: "chapter",
      courseId,
      moduleNumber,
      chapter: { chapter_number: chapterNumber, title, content, video_url: videoUrl || null },
    });

    router.replace(`/admin/courses/${courseId}/modules/${moduleNumber}`);
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm text-text-secondary">Loading…</p>
      </div>
    );
  }

  const previewNode = (
    <ContentPreview
      eyebrow={`Chapter ${chapterNumber}`}
      title={title}
      videoUrl={videoUrl}
      content={content}
      isChapter
    />
  );

  return (
    <div className="min-h-screen bg-bg pb-16">
      <div className="mx-auto max-w-2xl px-3 py-10">
        <Link
          href={`/admin/courses/${courseId}/modules/${moduleNumber}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Module {moduleNumber}
        </Link>

        {viewMode === "read" && (
          <>
            {previewNode}
            <button
              onClick={() => setViewMode("edit")}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md hover:brightness-105"
            >
              Edit Content
            </button>
          </>
        )}

        {viewMode === "preview" && (
          <>
            {previewNode}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setViewMode("edit")}
                className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-primary/5 active:bg-primary/10"
              >
                ← Back to Edit
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md hover:brightness-105 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Chapter"}
              </button>
            </div>
          </>
        )}

        {viewMode === "edit" && (
          <>
            {!expanded && (
              <>
                <h1 className="mt-4 font-display text-2xl font-bold text-text-primary">
                  Chapter {chapterNumber}
                </h1>

                <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <label className="mb-1 block text-sm font-medium text-text-primary">
                    Chapter Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  />

                  <label className="mb-1 mt-5 block text-sm font-medium text-text-primary">
                    Video Link (optional)
                  </label>
                  <input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                </div>
              </>
            )}

            <div className={expanded ? "" : "mt-4"}>
              {!expanded && (
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <label className="mb-1 block text-sm font-medium text-text-primary">
                    Chapter Content
                  </label>
                  <RichTextEditor
                    value={content}
                    onChange={setContent}
                    expanded={expanded}
                    onToggleExpand={() => setExpanded(true)}
                  />
                </div>
              )}

              {expanded && (
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  expanded={expanded}
                  onToggleExpand={() => setExpanded(false)}
                  footer={
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setExpanded(false);
                          setViewMode("preview");
                        }}
                        className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-primary/5 active:bg-primary/10"
                      >
                        Preview
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
                      >
                        {saving ? "Saving…" : "Save Chapter"}
                      </button>
                    </div>
                  }
                />
              )}

              {!expanded && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setViewMode("preview")}
                    className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-primary/5 active:bg-primary/10"
                  >
                    Preview
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md hover:brightness-105 disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save Chapter"}
                  </button>
                </div>
              )}
              {saveMessage && (
                <p className="mt-2 text-sm text-text-secondary">{saveMessage}</p>
              )}
            </div>
          </>
        )}

        {viewMode !== "read" && !expanded && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
            <h3 className="font-display text-sm font-semibold text-red-800">
              Danger Zone
            </h3>
            <p className="mt-1 text-xs text-red-700">
              This permanently deletes this chapter.
            </p>
            <button
              onClick={handleDeleteChapter}
              disabled={deleting}
              className="mt-3 w-full rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete This Chapter"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
