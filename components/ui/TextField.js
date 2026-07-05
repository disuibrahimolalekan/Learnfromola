"use client";

import { useState } from "react";

/**
 * Shared form input for every auth page.
 *
 * Props:
 * - id, label, type, value, onChange, placeholder, autoComplete
 * - error: string | undefined — shown inline below the field
 * - labelRight: optional node rendered to the right of the label (e.g. a "Forgot password?" link)
 */
export default function TextField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  labelRight,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-text-primary"
        >
          {label}
        </label>
        {labelRight}
      </div>

      <div className="relative">
        <input
          id={id}
          name={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/60 outline-none transition focus:ring-2 ${
            error
              ? "border-red-400 focus:border-red-400 focus:ring-red-100"
              : "border-border focus:border-primary focus:ring-primary/20"
          } ${isPassword ? "pr-12" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-text-secondary hover:text-text-primary"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        )}
      </div>

      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
            }
