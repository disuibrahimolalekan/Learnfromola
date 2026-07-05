import AuthBrandPanel from "@/components/auth/AuthBrandPanel";

// Wraps every page under app/(auth)/ — login, create-account, forgot-password.
// Each page only needs to render its form; the brand panel and the
// mobile-first page shell live here, once.
export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen w-full bg-card">
      <AuthBrandPanel />

      <div className="flex w-full flex-col items-center justify-center bg-bg px-6 py-12 lg:w-1/2">
        {/* Compact brand mark for mobile, where the brand panel is hidden */}
        <div className="mb-8 lg:hidden">
          <span className="font-display text-lg font-bold text-primary">
            Learn From Ola
          </span>
        </div>

        {children}
      </div>
    </div>
  );
}
