"use client";

import { useState } from "react";
import Link from "next/link";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { isRequired, isValidEmail } from "@/lib/validators";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function validate() {
    if (!isRequired(email)) return "Enter your email address.";
    if (!isValidEmail(email)) return "That email doesn't look right.";
    return "";
  }

  function handleSubmit(e) {
    e.preventDefault();
    const next = validate();
    setError(next);
    if (next) return;

    // TODO (Phase 2): replace with real password-reset call.
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 900);
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
      <h2 className="font-display text-2xl font-bold text-text-primary">
        Reset your password
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        Enter the email you used when purchasing the course.
      </p>

      {submitted ? (
        <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">
            If that email is on file, reset instructions are on the way.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
          <TextField
            id="email"
            label="Email address"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            error={error}
          />

          <Button loading={loading}>Reset password</Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-text-secondary">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-primary hover:text-secondary">
          Back to login
        </Link>
      </p>
    </div>
  );
        }
