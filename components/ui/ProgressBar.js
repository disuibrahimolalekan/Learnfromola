export default function ProgressBar({ percent }) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-border">
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
