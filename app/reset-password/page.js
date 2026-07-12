"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [validLink, setValidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // When someone arrives via the reset-password email link, Supabase
    // reads the recovery token from the URL and fires this event, giving
    // us a temporary session just for setting a new password.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setValidLink(true);
        setChecking(false);
      }
    });

    // Fallback: if the event already fired before this component mounted,
    // check whether a session already exists.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidLink(true);
      }
      setChecking(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.replace("/dashboard"), 2000);
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm text-text-secondary">Loading…</p>
      </div>
    );
  }

  if (!validLink) {
    return (
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h2 className="font-display text-2xl font-bold text-text-primary">
          Link expired
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          This password reset link is invalid or has expired. Please request a
          new one.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
      <h2 className="font-display text-2xl font-bold text-text-primary">
        Set a new password
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        Choose a new password for your account.
      </p>

      {success ? (
        <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">
            Password updated. Taking you to your dashboard…
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
          <TextField
            id="password"
            label="New password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
          <TextField
            id="confirmPassword"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            error={error}
          />

          <Button loading={loading}>Set new password</Button>
        </form>
      )}
    </div>
  );
      }
