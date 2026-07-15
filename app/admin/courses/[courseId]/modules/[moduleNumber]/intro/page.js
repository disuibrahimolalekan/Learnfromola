"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ContentPreview from "@/components/admin/ContentPreview";

export default function ModuleIntroEditPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId;
  const moduleNumber = Number(params.moduleNumber);

  const [checking, setChecking] = useState(true);
  const [moduleTitle, setModuleTitle] = useState("");
  const [introContent, setIntroContent] = useState("");
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
        .from("modules")
        .select("title, intro_content")
        .eq("course_id", courseId)
        .eq("number", moduleNumber)
        .maybeSingle();

      setModuleTitle(data?.title || "");
      setIntroContent(data?.intro_content || "");
      setChecking(false);
    }
    load();
  }, [courseId, moduleNumber, router]);

  async function handleSave() {
    setSaving(true);
    setSaveMessage("");
    const { error } = await supabase
      .from("modules")
      .update({ intro_content: introContent || null })
      .eq("course_id", courseId)
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
          href={`/admin/courses/${courseId}/modules/${moduleNumber}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Module {moduleNumber}
        </Link>

        <h1 className="mt-4 font-display text-2xl font-bold text-text-primary">
          Module Introduction
        </h1>

        <div className="mt-6">
          {mode === "edit" ? (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <RichTextEditor value={introContent} onChange={setIntroContent} />
            </div>
          ) : (
            <ContentPreview
              eyebrow={`Module ${moduleNumber}`}
              title={moduleTitle}
              content={introContent}
            />
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
              {saving ? "Saving…" : "Save Introduction"}
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
