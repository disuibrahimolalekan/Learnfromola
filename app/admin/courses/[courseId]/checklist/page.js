"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ContentPreview from "@/components/admin/ContentPreview";

export default function AdminChecklistEditPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId;

  const [checking, setChecking] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mode, setMode] = useState("edit");
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

    const { error } = await supabase
      .from("pages")
      .upsert(
        { course_id: courseId, slug: "checklist", title, content },
        { onConflict: "course_id,slug" }
      );

    setSaving(false);
    setSaveMessage(error ? `Error: ${error.message}` : "Saved successfully.");
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
          Edit Checklist Page
        </h1>

        {mode === "edit" && (
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
        )}

        <div className="mt-4">
          {mode === "edit" ? (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <label className="mb-1 block text-sm font-medium text-text-primary">
                Content
              </label>
              <RichTextEditor value={content} onChange={setContent} />
            </div>
          ) : (
            <ContentPreview title={title} content={content} />
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setMode(mode === "edit" ? "preview" : "edit")}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-primary/5 active:bg-primary/10"
            >
              {mode === "edit" ? "Preview" : "← Back to Edit"}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md hover:brightness-105 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Page"}
            </button>
          </div>
          {saveMessage && (
            <p className="mt-2 text-sm text-text-secondary">{saveMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
          }
