"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function AdminChapterEditPage() {
  const router = useRouter();
  const params = useParams();
  const moduleNumber = Number(params.moduleNumber);
  const chapterNumber = Number(params.chapterNumber);

  const [checking, setChecking] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
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
        .from("chapters")
        .select("title, content, video_url")
        .eq("module_number", moduleNumber)
        .eq("chapter_number", chapterNumber)
        .maybeSingle();

      setTitle(data?.title || "");
      setContent(data?.content || "");
      setVideoUrl(data?.video_url || "");
      setChecking(false);
    }
    load();
  }, [moduleNumber, chapterNumber, router]);

  async function handleSave() {
    setSaving(true);
    setSaveMessage("");
    const { error } = await supabase
      .from("chapters")
      .update({ title, content, video_url: videoUrl || null })
      .eq("module_number", moduleNumber)
      .eq("chapter_number", chapterNumber);
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
          href={`/admin/modules/${moduleNumber}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Module {moduleNumber}
        </Link>

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

          <label className="mb-1 mt-5 block text-sm font-medium text-text-primary">
            Chapter Content (Markdown)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 font-mono text-xs text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md hover:brightness-105 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Chapter"}
          </button>
          {saveMessage && (
            <p className="mt-2 text-sm text-text-secondary">{saveMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
