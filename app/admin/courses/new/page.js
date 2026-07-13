"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

// Turns a course name into a URL-safe slug, e.g. "AI Software Builder" -> "ai-software-builder".
function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AddCoursePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function verify() {
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
      setChecking(false);
    }
    verify();
  }, [router]);

  async function handleCreate() {
    setError("");

    const trimmedName = name.trim();
    const trimmedCode = productCode.trim();

    if (!trimmedName) {
      setError("Course name is required.");
      return;
    }
    if (!trimmedCode) {
      setError("Selar product code is required.");
      return;
    }

    setSaving(true);

    const { data, error: insertError } = await supabase
      .from("courses")
      .insert({
        name: trimmedName,
        slug: slugify(trimmedName),
        selar_product_code: trimmedCode,
      })
      .select("id")
      .single();

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    // Go straight into the new course's content editor.
    router.push(`/admin/courses/${data.id}/modules`);
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm text-text-secondary">Verifying access…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-16">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link href="/admin" className="text-sm font-medium text-primary hover:underline">
          ← Admin Dashboard
        </Link>

        <h1 className="mt-4 font-display text-2xl font-bold text-text-primary">
          Add Course
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          The Selar product code is what routes future purchases of this course to the right students.
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <label className="mb-1 block text-sm font-medium text-text-primary">
            Course Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. AI Software Builder"
            className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />

          <label className="mb-1 mt-5 block text-sm font-medium text-text-primary">
            Selar Product Code
          </label>
          <input
            value={productCode}
            onChange={(e) => setProductCode(e.target.value)}
            placeholder="e.g. ABCD1234"
            className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            onClick={handleCreate}
            disabled={saving}
            className="mt-5 w-full rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md hover:brightness-105 disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create Course"}
          </button>
        </div>
      </div>
    </div>
  );
      }
