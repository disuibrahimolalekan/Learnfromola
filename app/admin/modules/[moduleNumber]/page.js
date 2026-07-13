"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import MarkdownToolbar from "@/components/admin/MarkdownToolbar";

export default function AdminModuleEditPage() {
  const router = useRouter();
  const params = useParams();
  const moduleNumber = Number(params.moduleNumber);

  const [checking, setChecking] = useState(true);
  const [title, setTitle] = useState("");
  const [introContent, setIntroContent] = useState("");
  const [chapters, setChapters] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const introTextareaRef = useRef(null);

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
          .eq("number", moduleNumber)
          .maybeSingle(),
        supabase
          .from("chapters")
          .select("chapter_number, title")
          .eq("module_number", moduleNumber)
          .order("chapter_number", { ascending: true }),
      ]);

      setTitle(moduleResult.data?.title || "");
      setIntroContent(moduleResult.data?.intro_content || "");
      setChapters(chaptersResult.data || []);
      setChecking(false);
    }
    load();
  }, [moduleNumber, router]);

  async function handleSave() {
    setSaving(true);
    setSaveMessage("");
    const { error } = await supabase
      .from("modules")
      .update({ title, intro_content: introContent || null })
      .eq("number", moduleNumber);
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
          href="/admin/modules"
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

          <label className="mb-1 mt-5 block text-sm font-medium text-text-primary">
            Intro Content
          </label>
          <MarkdownToolbar
            textareaRef={introTextareaRef}
            value={introContent}
            onChange={setIntroContent}
          />
          <textarea
            ref={introTextareaRef}
            value={introContent}
            onChange={(e) => setIntroContent(e.target.value)}
            rows={14}
            placeholder="Leave empty if this module has no introduction."
            className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 font-mono text-xs text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md hover:brightness-105 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Module"}
          </button>
          {saveMessage && (
            <p className="mt-2 text-sm text-text-secondary">{saveMessage}</p>
          )}
        </div>

        <h2 className="mt-8 font-display text-lg font-semibold text-text-primary">
          Chapters
        </h2>
        <div className="mt-3 space-y-3">
          {chapters.map((ch) => (
            <Link
              key={ch.chapter_number}
              href={`/admin/modules/${moduleNumber}/chapter/${ch.chapter_number}`}
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
      </div>
    </div>
  );
}
