"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRequireAdmin } from "@/lib/useRequireAdmin";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { checking, session } = useRequireAdmin();

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [menuOpen, setMenuOpen] = useState(false);
  const [resetNotification, setResetNotification] = useState(null);
  const menuRef = useRef(null);

  const fullName = session?.user.user_metadata?.full_name || session?.user.email?.split("@")[0] || "";

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
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-dismiss reset notification after 3 seconds
  useEffect(() => {
    if (!resetNotification) return;
    const timer = setTimeout(() => setResetNotification(null), 3000);
    return () => clearTimeout(timer);
  }, [resetNotification]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function handleResetPassword() {
    const email = session?.user.email;
    if (!email) return;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      console.error("Password reset email error:", error.message);
    } else {
      setResetNotification(
        "Check your email for a reset link, also check your spam folder if you don't see it."
      );
    }
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
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-sm font-semibold text-text-primary transition hover:bg-primary/5 active:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label="Account menu"
            >
              {fullName.charAt(0).toUpperCase()}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 z-10 w-64 rounded-2xl border border-border bg-card p-2 shadow-md">
                {resetNotification ? (
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <p className="text-sm text-emerald-600 flex-1 pr-2">
                      {resetNotification}
                    </p>
                    <button
                      onClick={() => setResetNotification(null)}
                      className="flex-shrink-0 rounded-lg p-1 text-xs text-text-secondary hover:text-text-primary"
                      aria-label="Dismiss"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleResetPassword}
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
                href={`/admin/courses/${course.id}`}
                className="block rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:bg-primary/5 hover:shadow-md active:bg-primary/10"
              >
                <h3 className="font-display text-base font-semibold text-text-primary">
                  {course.name}
                </h3>
                <p className="mt-1 text-xs text-text-secondary">
                  Manage content and students
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
