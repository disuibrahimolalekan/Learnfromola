"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import { Markdown } from "tiptap-markdown";
import { isYoutubeUrl } from "@/lib/youtube";

function normalizeUrl(url) {
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:)/i.test(trimmed) || trimmed.startsWith("/")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export default function RichTextEditor({ value, onChange }) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [dialogUrl, setDialogUrl] = useState("");
  const [linkSelection, setLinkSelection] = useState(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
        link: { openOnClick: false, autolink: false },
      }),
      TiptapImage,
      Markdown.configure({ html: false, transformPastedText: true }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      // Pass through exactly what the editor itself produced — no
      // reformatting here. Reformatting on every keystroke made this look
      // like an external change each time, which reset the whole document
      // and threw the cursor to the bottom. Spacing cleanup now happens
      // once, at Save time, in each page's handleSave.
      onChange(editor.storage.markdown.getMarkdown());
    },
    editorProps: {
      attributes: {
        class: "markdown-content min-h-[240px] focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== undefined) {
      const current = editor.storage.markdown.getMarkdown();
      if (value !== current) {
        editor.commands.setContent(value || "");
      }
    }
  }, [value, editor]);

  if (!editor) return null;

  function openLinkDialog() {
    const { from, to } = editor.state.selection;
    setLinkSelection({ from, to });
    setDialogUrl("");
    setLinkDialogOpen(true);
  }

  function handleInsertLink() {
    if (!dialogUrl.trim() || !linkSelection) return;
    const url = normalizeUrl(dialogUrl);
    const { from, to } = linkSelection;
    const isVideo = isYoutubeUrl(url);

    if (from === to) {
      const label = isVideo ? "🎥 Watch on YouTube" : url;
      editor
        .chain()
        .focus()
        .insertContentAt(from, {
          type: "text",
          text: label,
          marks: [{ type: "link", attrs: { href: url } }],
        })
        .run();
    } else {
      editor.chain().focus().setTextSelection({ from, to }).setLink({ href: url }).run();
    }

    setDialogUrl("");
    setLinkDialogOpen(false);
    setLinkSelection(null);
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
          title="Link or YouTube video"
          onClick={openLinkDialog}
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
              Add Link or YouTube Video
            </h3>
            <input
              autoFocus
              value={dialogUrl}
              onChange={(e) => setDialogUrl(e.target.value)}
              placeholder="example.com or a YouTube link"
              className="mt-3 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
            <p className="mt-2 text-xs text-text-secondary">
              A YouTube link will show as a playable video wherever it&apos;s placed. Anything else becomes a clickable link.
            </p>
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
                Add
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
