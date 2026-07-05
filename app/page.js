"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// The six modules of the AI Software Builder Course, used only as a visual
// motif on the brand panel — a real sequence, not decoration for its own sake.
const MODULES = [
  "Foundations",
  "Prompting",
  "Architecture",
  "Building",
  "Shipping",
  "Scaling",
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError("That email and password don't match. Try again.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen w-full bg-card">
      {/* Brand panel — hidden on small screens, shown from lg breakpoint up */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-primary to-secondary lg:flex lg:flex-col lg:justify-between p-12 xl:p-16">
        {/* Ambient glow accents */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative">
          <span className="font-display text-xl font-bold text-white">
            Learn From Ola
          </span>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display text-4xl font-extrabold leading-tight text-white xl:text-5xl">
            AI Software Builder Course
          </h1>
          <p className="mt-4 text-base text-white/80 xl:text-lg">
            Six modules. One clear path from idea to shipped product.
          </p>

          {/* Signature element: the module sequence, ascending diagonally */}
          <ol className="mt-12 space-y-4">
            {MODULES.map((name, i) => (
              <li key={name} className="flex items-center gap-4">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/30 font-display text-sm font-semibold text-white"
                  style={{ marginLeft: `${i * 10}px` }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="text-sm text-white/70"
                  style={{ marginLeft: `${i * 10}px` }}
                >
                  {name}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} Learn From Ola. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col items-center justify-center bg-bg px-6 py-12 lg:w-1/2">
        {/* Compact brand mark for mobile, where the left panel is hidden */}
        <div className="mb-8 lg:hidden">
          <span className="font-display text-lg font-bold text-primary">
            Learn From Ola
          </span>
        </div>

        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h2 className="font-display text-2xl font-bold text-text-primary">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Log in to continue the AI Software Builder Course.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-text-primary"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/60 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-text-primary"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:text-secondary"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 pr-12 text-sm text-text-primary placeholder:text-text-secondary/60 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-text-secondary hover:text-text-primary"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            New here?{" "}
            <Link
              href="/create-account"
              className="font-medium text-primary hover:text-secondary"
            >
              Create your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
