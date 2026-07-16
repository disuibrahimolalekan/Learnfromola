"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ContentPreview from "@/components/admin/ContentPreview";
import { normalizeMediaSpacing } from "@/lib/youtube";

export default function AdminChecklistEditPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId;

  const [checking, setChecking] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [viewMode, setViewMode] = useState("read");
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

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
        .from("pages")
        .select("title, content")
        .eq("course_id", courseId)
        .eq("slug", "checklist")
        .maybeSingle();

      setTitle(data?.title || "Security & Deployment Checklist");
      setContent(data?.content || "");
      setChecking(false);
    }
    load();
  }, [router, courseId]);

  async function handleSave() {
    setSaving(true);
    setSaveMessage("");
    const cleanContent = normalizeMediaSpacing(content);

    const { error } = await supabase
      .from("pages")
      .upsert(
        { course_id: courseId, slug: "checklist", title, content: cleanContent },
        { onConflict: "course_id,slug" }
      );

    setSaving(false);

    if (error) {
      setSaveMessage(`Error: ${error.message}`);
      return;
    }

    setContent(cleanContent);
    setExpanded(false);
    setViewMode("read");
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm text-text-secondary">Loading…</p>
      </div>
    );
  }

  const previewNode = <ContentPreview title={title} content={content} />;

  return (
    <div className="min-h-screen bg-bg pb-16">
      <div className="mx-auto max-w-2xl px-3 py-10">
        <Link
          href={`/admin/courses/${courseId}/modules`}
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Manage Content
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
                {saving ? "Saving…" : "Save Page"}
              </button>
            </div>
          </>
        )}

        {viewMode === "edit" && (
          <>
            {!expanded && (
              <>
                <h1 className="mt-4 font-display text-2xl font-bold text-text-primary">
                  Edit Checklist Page
                </h1>

                <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <label className="mb-1 block text-sm font-medium text-text-primary">
                    Page Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                </div>
              </>
            )}

            <div className={expanded ? "" : "mt-4"}>
              {!expanded && (
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <label className="mb-1 block text-sm font-medium text-text-primary">
                    Content
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
                        {saving ? "Saving…" : "Save Page"}
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
                    {saving ? "Saving…" : "Save Page"}
                  </button>
                </div>
              )}
              {saveMessage && (
                <p className="mt-2 text-sm text-text-secondary">{saveMessage}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
                  }
