"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { isRequired, isValidEmail } from "@/lib/validators";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const next = {};
    if (!isRequired(email)) next.email = "Enter your email address.";
    else if (!isValidEmail(email)) next.email = "That email doesn't look right.";
    if (!isRequired(password)) next.password = "Enter your password.";
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setErrors({ password: "That email and password don't match." });
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
      <h2 className="font-display text-2xl font-bold text-text-primary">
        Welcome back
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        Log in to continue the AI Software Builder Course.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        <TextField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          error={errors.email}
        />

        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          error={errors.password}
          labelRight={
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary hover:text-secondary"
            >
              Forgot password?
            </Link>
          }
        />

        <Button loading={loading}>Log in</Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        New here?{" "}
        <Link href="/create-account" className="font-medium text-primary hover:text-secondary">
          Create your account
        </Link>
      </p>
    </div>
  );
}
