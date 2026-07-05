export default function Button({ children, loading, disabled, type = "submit", ...rest }) {
  return (
    <button
      type={type}
      disabled={loading || disabled}
      className="w-full rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:shadow-md hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      {...rest}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Please wait…
        </span>
      ) : (
        children
      )}
    </button>
  );
}
