"use client";

// A small formatting toolbar that inserts markdown syntax into a textarea
// via button clicks, so course creators never have to type ** or # symbols
// themselves. The textarea's content stays plain markdown underneath —
// nothing about how chapters are stored or rendered changes.

function getLineBounds(value, start, end) {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  let lineEnd = value.indexOf("\n", end);
  if (lineEnd === -1) lineEnd = value.length;
  return { lineStart, lineEnd };
}

function wrapSelection(textarea, value, onChange, before, after = before) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end) || "text";
  const newValue = value.slice(0, start) + before + selected + after + value.slice(end);
  onChange(newValue);
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
  });
}

function prefixLines(textarea, value, onChange, prefix) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const { lineStart, lineEnd } = getLineBounds(value, start, end);
  const block = value.slice(lineStart, lineEnd);
  const prefixed = block
    .split("\n")
    .map((line) => (line.startsWith(prefix) ? line : prefix + line))
    .join("\n");
  const newValue = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
  onChange(newValue);
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(lineStart, lineStart + prefixed.length);
  });
}

function insertAtCursor(textarea, value, onChange, text, cursorOffset) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const newValue = value.slice(0, start) + text + value.slice(end);
  onChange(newValue);
  requestAnimationFrame(() => {
    textarea.focus();
    const pos = start + (cursorOffset ?? text.length);
    textarea.setSelectionRange(pos, pos);
  });
}

const buttons = [
  { label: "B", title: "Bold", action: "bold", className: "font-bold" },
  { label: "I", title: "Italic", action: "italic", className: "italic" },
  { label: "H", title: "Heading", action: "heading" },
  { label: "•", title: "Bullet list", action: "list" },
  { label: "🔗", title: "Link", action: "link" },
  { label: "🖼", title: "Image", action: "image" },
];

export default function MarkdownToolbar({ textareaRef, value, onChange }) {
  function handleClick(action) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (action === "bold") wrapSelection(textarea, value, onChange, "**");
    if (action === "italic") wrapSelection(textarea, value, onChange, "*");
    if (action === "heading") prefixLines(textarea, value, onChange, "## ");
    if (action === "list") prefixLines(textarea, value, onChange, "- ");

    if (action === "link") {
      const url = window.prompt("Link URL:");
      if (!url) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.slice(start, end) || "link text";
      const newValue = value.slice(0, start) + `[${selected}](${url})` + value.slice(end);
      onChange(newValue);
      requestAnimationFrame(() => textarea.focus());
    }

    if (action === "image") {
      const url = window.prompt("Image URL:");
      if (!url) return;
      insertAtCursor(textarea, value, onChange, `

![image](${url})

`);
    }
  }

  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      {buttons.map((btn) => (
        <button
          key={btn.action}
          type="button"
          title={btn.title}
          onClick={() => handleClick(btn.action)}
          className={`flex h-8 min-w-8 items-center justify-center rounded-lg border border-border bg-card px-2 text-sm text-text-primary transition hover:bg-primary/5 active:bg-primary/10 ${btn.className || ""}`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
                               }
