
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { isRequired, isValidEmail, isValidPassword } from "@/lib/validators";
import { supabase } from "@/lib/supabaseClient";

export default function CreateAccountPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const next = {};
    if (!isRequired(fullName)) next.fullName = "Enter your full name.";

    if (!isRequired(email)) next.email = "Enter your email address.";
    else if (!isValidEmail(email)) next.email = "That email doesn't look right.";

    if (!isRequired(password)) next.password = "Create a password.";
    else if (!isValidPassword(password)) next.password = "Use at least 8 characters.";

    if (!isRequired(confirmPassword)) next.confirmPassword = "Confirm your password.";
    else if (confirmPassword !== password) next.confirmPassword = "Passwords don't match.";

    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);

    // NOTE: this does not yet check whether this email actually purchased
    // the course on Selar — that guard is added once Selar is connected.
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    });

    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        setErrors({ email: "An account with this email already exists." });
      } else {
        setErrors({ email: "Something went wrong. Please try again." });
      }
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
      <h2 className="font-display text-2xl font-bold text-text-primary">
        Create your account
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        Use the same email you purchased the course with.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        <TextField
          id="fullName"
          label="Full name"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Doe"
          error={errors.fullName}
        />

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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          error={errors.password}
        />

        <TextField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
          error={errors.confirmPassword}
        />

        <Button loading={loading}>Create account</Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:text-secondary">
          Login
        </Link>
      </p>
    </div>
  );
    }
