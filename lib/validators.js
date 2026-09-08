export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isRequired(value) {
  return value.trim().length > 0;
}

export function isValidPassword(value) {
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}
