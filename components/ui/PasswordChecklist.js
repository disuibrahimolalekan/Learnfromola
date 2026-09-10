export default function PasswordChecklist({ password }) {
  const requirements = [
    { label: "At least 6 characters", met: password.length >= 6 },
    { label: "One uppercase letter (A-Z)", met: /[A-Z]/.test(password) },
    { label: "One number (0-9)", met: /[0-9]/.test(password) },
    { label: "One special character (e.g. @ ! #)", met: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <ul className="mt-2 space-y-1">
      {requirements.map((req) => (
        <li
          key={req.label}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            req.met ? "text-emerald-600" : "text-text-secondary"
          }`}
        >
          <span className="w-3 text-center">{req.met ? "✓" : "○"}</span>
          {req.label}
        </li>
      ))}
    </ul>
  );
}
