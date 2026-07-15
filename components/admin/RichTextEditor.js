"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import { Markdown } from "tiptap-markdown";

// If someone types a bare domain without a protocol, browsers treat it as
// a path relative to the current page instead of a real destination —
// this quietly broke a link before. Auto-prepend https:// unless it's
// already a full URL, a mailto link, or an in-site path starting with "/".
function normalizeUrl(url) {
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:)/i.test(trimmed) || trimmed.startsWith("/")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

// A WYSIWYG editor that stores and loads plain markdown underneath (via
// tiptap-markdown), so all existing chapter/module/checklist content in
// Supabase keeps working untouched — only the *editing experience*
// changes from raw markdown text to visual formatting.
export default function RichTextEditor({ value, onChange }) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [dialogUrl, setDialogUrl] = useState("");

  const editor = useEditor({
    immediatelyRender: false, // avoids SSR hydration mismatch in Next.js
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      TiptapLink.configure({ openOnClick: false, autolink: false }),
      TiptapImage,
      Markdown.configure({ html: false, transformPastedText: true }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.storage.markdown.getMarkdown());
    },
    editorProps: {
      attributes: {
        // Reuses the same class the real student-facing pages use, so
        // what you see while typing already looks like the final page.
        class: "markdown-content min-h-[240px] focus:outline-none",
      },
    },
  });

  // The real value arrives async (after a Supabase fetch completes,
  // slightly after this component first mounts) — sync it in when it
  // changes from outside, but don't fight the user's own typing.
  useEffect(() => {
    if (editor && value !== undefined) {
      const current = editor.storage.markdown.getMarkdown();
      if (value !== current) {
        editor.commands.setContent(value || "");
      }
    }
  }, [value, editor]);

  if (!editor) return null;

  function handleInsertLink() {
    if (!dialogUrl.trim()) return;
    const url = normalizeUrl(dialogUrl);
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
    setDialogUrl("");
    setLinkDialogOpen(false);
  }

  function handleInsertImage() {
    if (!dialogUrl.trim()) return;
    const url = normalizeUrl(dialogUrl);
    editor.chain().focus().setImage({ src: url }).run();
    setDialogUrl("");
    setImageDialogOpen(false);
  }

  const formatButtons = [
    { label: "B", title: "Bold", className: "font-bold", active: editor.isActive("bold"), run: () => editor.chain().focus().toggleBold().run() },
    { label: "I", title: "Italic", className: "italic", active: editor.isActive("italic"), run: () => editor.chain().focus().toggleItalic().run() },
    { label: "H1", title: "Heading 1", active: editor.isActive("heading", { level: 1 }), run: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: "H2", title: "Heading 2", active: editor.isActive("heading", { level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "•", title: "Bullet list", active: editor.isActive("bulletList"), run: () => editor.chain().focus().toggleBulletList().run() },
    { label: "1.", title: "Numbered list", active: editor.isActive("orderedList"), run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: "❝", title: "Quote", active: editor.isActive("blockquote"), run: () => editor.chain().focus().toggleBlockquote().run() },
  ];

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {formatButtons.map((btn) => (
          <button
            key={btn.title}
            type="button"
            title={btn.title}
            onClick={btn.run}
            className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm transition ${
              btn.active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-text-primary hover:bg-primary/5"
            } ${btn.className || ""}`}
          >
            {btn.label}
          </button>
        ))}

        <button
          type="button"
          title="Link"
          onClick={() => {
            setDialogUrl("");
            setLinkDialogOpen(true);
          }}
          className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm transition ${
            editor.isActive("link")
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-text-primary hover:bg-primary/5"
          }`}
        >
          🔗
        </button>

        <button
          type="button"
          title="Image"
          onClick={() => {
            setDialogUrl("");
            setImageDialogOpen(true);
          }}
          className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-border bg-card px-2 text-sm text-text-primary transition hover:bg-primary/5"
        >
          🖼
        </button>

        <button
          type="button"
          title="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-border bg-card px-2 text-sm text-text-primary transition hover:bg-primary/5 disabled:opacity-40"
        >
          ↶
        </button>
        <button
          type="button"
          title="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-border bg-card px-2 text-sm text-text-primary transition hover:bg-primary/5 disabled:opacity-40"
        >
          ↷
        </button>
      </div>

      <div className="rounded-xl border border-border bg-bg px-4 py-3">
        <EditorContent editor={editor} />
      </div>

      {linkDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setLinkDialogOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl bg-card p-5 shadow-lg sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-base font-semibold text-text-primary">
              Add Link
            </h3>
            <input
              autoFocus
              value={dialogUrl}
              onChange={(e) => setDialogUrl(e.target.value)}
              placeholder="example.com or https://..."
              className="mt-3 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setLinkDialogOpen(false)}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleInsertLink}
                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}

      {imageDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setImageDialogOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl bg-card p-5 shadow-lg sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-base font-semibold text-text-primary">
              Add Image
            </h3>
            <input
              autoFocus
              value={dialogUrl}
              onChange={(e) => setDialogUrl(e.target.value)}
              placeholder="https://..."
              className="mt-3 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
            <a
              href="https://imgbb.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-xs font-medium text-primary hover:underline"
            >
              Don&apos;t have an image link? Tap here to create one →
            </a>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setImageDialogOpen(false)}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleInsertImage}
                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
              >
                Add Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  }
