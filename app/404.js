export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-text-primary">Page not found</h1>
      <p className="mt-3 max-w-md text-sm text-text-secondary">
        The page you requested does not exist or is not available on this domain.
      </p>
    </main>
  );
}
