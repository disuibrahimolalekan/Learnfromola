const MODULES = [
  "Foundations",
  "Prompting",
  "Architecture",
  "Building",
  "Shipping",
  "Scaling",
];

// The left-side brand panel shared across all auth screens. Hidden on
// small screens (mobile-first: the form is what matters on a phone),
// shown from the lg breakpoint up.
export default function AuthBrandPanel() {
  return (
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
          Learn to build real software with AI.
        </p>

        {/* Signature element: the module sequence, ascending diagonally.
            A real sequence (the course's 6 modules), not decoration. */}
        <ol className="mt-12 space-y-4">
          {MODULES.map((name, i) => (
            <li key={name} className="flex items-center gap-4">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/30 font-display text-sm font-semibold text-white"
                style={{ marginLeft: `${i * 10}px` }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm text-white/70" style={{ marginLeft: `${i * 10}px` }}>
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
  );
    }
