// Simple vertical flowchart: styled boxes connected by arrows.
// Takes an array of step labels and renders them top to bottom.
export default function FlowChart({ steps, title }) {
  return (
    <div className="markdown-content my-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      {title && (
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-primary">
          {title}
        </p>
      )}
      <div className="flex flex-col items-center">
        {steps.map((step, index) => (
          <div key={index} className="flex w-full flex-col items-center">
            <div className="w-full max-w-xs rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-center text-sm font-medium text-text-primary">
              {step}
            </div>
            {index < steps.length - 1 && (
              <div className="my-1 text-lg leading-none text-primary">↓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
        }
