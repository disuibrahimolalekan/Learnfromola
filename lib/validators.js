// Small, dependency-free validation helpers shared by every auth form.
// Kept framework-agnostic so they're easy to reuse once real backend
// validation is added in Phase 2.

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isRequired(value) {
  return value.trim().length > 0;
}

export function isValidPassword(value) {
  // Baseline rule for now — tighten this once the backend enforces
  // real password policy (Phase 2).
  return value.length >= 8;
}
