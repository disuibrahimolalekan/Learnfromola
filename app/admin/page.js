"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [fullName, setFullName] = useState("");
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    async function verifyAdmin() {
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

      setFullName(
        session.user.user_metadata?.full_name || session.user.email.split("@")[0]
      );
      setChecking(false);
    }

    verifyAdmin();
  }, [router]);

  // Loaded separately from the admin-gate check above so the course grid
  // can be re-fetched independently (e.g. right after adding a course).
  useEffect(() => {
    async function loadCourses() {
      const { data, error } = await supabase
        .from("courses")
        .select("id, name")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to load courses:", error.message);
      }
      setCourses(data || []);
      setLoadingCourses(false);
    }
    loadCourses();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
        setShowResetForm(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function handlePasswordReset(e) {
    e.preventDefault();
    setResetError("");
    setResetSuccess(false);

    if (newPassword.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setResetSubmitting(false);

    if (error) {
      setResetError(error.message);
      return;
    }

    setResetSuccess(true);
    setNewPassword("");
    setConfirmPassword("");
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
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              Admin Dashboard
            </span>
            <h1 className="mt-1 truncate font-display text-2xl font-bold text-text-primary">
              Welcome, {fullName}
            </h1>
          </div>

          {/* Account menu */}
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={() => {
                setMenuOpen((open) => !open);
                setShowResetForm(false);
                setResetError("");
                setResetSuccess(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-sm font-semibold text-text-primary transition hover:bg-primary/5 active:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label="Account menu"
            >
              {fullName.charAt(0).toUpperCase()}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 z-10 w-64 rounded-2xl border border-border bg-card p-2 shadow-md">
                {!showResetForm ? (
                  <>
                    <button
                      onClick={() => setShowResetForm(true)}
                      className="block w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium text-text-primary transition hover:bg-primary/5 active:bg-primary/10"
                    >
                      Reset Password
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium text-text-primary transition hover:bg-primary/5 active:bg-primary/10"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <form onSubmit={handlePasswordReset} className="p-2">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                      Set a new password
                    </p>
                    <input
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mb-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mb-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    />

                    {resetError && (
                      <p className="mb-2 text-xs text-red-600">{resetError}</p>
                    )}
                    {resetSuccess && (
                      <p className="mb-2 text-xs font-medium text-emerald-600">
                        Password updated successfully.
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={resetSubmitting}
                        className="flex-1 rounded-lg bg-gradient-to-r from-primary to-secondary px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {resetSubmitting ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetForm(false)}
                        className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-primary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Courses */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Courses
          </h2>
          <Link
            href="/admin/courses/new"
            className="flex-shrink-0 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2 text-xs font-semibold text-white shadow-sm"
          >
            + Add Course
          </Link>
        </div>

        <div className="mt-3 space-y-3">
          {loadingCourses ? (
            <p className="text-sm text-text-secondary">Loading courses…</p>
          ) : courses.length === 0 ? (
            <p className="text-sm text-text-secondary">
              No courses yet. Tap &quot;+ Add Course&quot; to create your first one.
            </p>
          ) : (
            courses.map((course) => (
              <Link
                key={course.id}
                href={`/admin/courses/${course.id}/modules`}
                className="block rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:bg-primary/5 hover:shadow-md active:bg-primary/10"
              >
                <h3 className="font-display text-base font-semibold text-text-primary">
                  {course.name}
                </h3>
                <p className="mt-1 text-xs text-text-secondary">
                  Manage modules and chapters
                </p>
              </Link>
            ))
          )}

          {!loadingCourses && (
            <Link
              href="/admin/pages/checklist"
              className="block rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:bg-primary/5 hover:shadow-md active:bg-primary/10"
            >
              <h3 className="font-display text-base font-semibold text-text-primary">
                Edit Checklist Page
              </h3>
              <p className="mt-1 text-xs text-text-secondary">
                Rename or edit the Security &amp; Deployment Checklist
              </p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
                  }
