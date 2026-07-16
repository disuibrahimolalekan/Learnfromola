"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { Node as TiptapNode, Mark, mergeAttributes } from "@tiptap/core";
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

// A paragraph that can carry a text-align attribute. Replaces StarterKit's
// built-in paragraph (which can't persist this) so alignment actually
// survives being saved and reloaded — verified by testing, not assumed.
const AlignableParagraph = TiptapNode.create({
  name: "paragraph",
  priority: 1000,
  group: "block",
  content: "inline*",
  addAttributes() {
    return {
      textAlign: {
        default: null,
        parseHTML: (element) => element.style.textAlign || null,
        renderHTML: (attributes) => {
          if (!attributes.textAlign || attributes.textAlign === "left") return {};
          return { style: `text-align: ${attributes.textAlign}` };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: "p" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["p", mergeAttributes(HTMLAttributes), 0];
  },
  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          if (node.attrs.textAlign && node.attrs.textAlign !== "left") {
            state.write(`<p style="text-align: ${node.attrs.textAlign}">`);
            state.renderInline(node);
            state.write(`</p>`);
            state.closeBlock(node);
          } else {
            state.renderInline(node);
            state.closeBlock(node);
          }
        },
      },
    };
  },
  addCommands() {
    return {
      setTextAlign:
        (alignment) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, { textAlign: alignment }),
    };
  },
});

// An inline style (like Bold/Italic) rather than a heading — can sit
// mixed with normal text on the same line, which real headings can't do.
const TextSize = Mark.create({
  name: "textSize",
  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.size) return {};
          return { style: `font-size: ${attributes.size}` };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[style*="font-size"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", HTMLAttributes, 0];
  },
  addCommands() {
    return {
      setTextSize:
        (size) =>
        ({ commands }) =>
          commands.setMark(this.name, { size }),
      unsetTextSize:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});

export default function RichTextEditor({ value, onChange, expanded = false, onToggleExpand, footer }) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [sizeMenuOpen, setSizeMenuOpen] = useState(false);
  const [alignMenuOpen, setAlignMenuOpen] = useState(false);
  const [dialogUrl, setDialogUrl] = useState("");
  const [linkSelection, setLinkSelection] = useState(null);
  const [resolvingImage, setResolvingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
        link: { openOnClick: false, autolink: false },
        paragraph: false,
      }),
      AlignableParagraph,
      TextSize,
      TiptapImage,
      Markdown.configure({ html: true, transformPastedText: true }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.storage.markdown.getMarkdown());
    },
    editorProps: {
      attributes: {
        class: expanded
          ? "markdown-content focus:outline-none"
          : "markdown-content min-h-[240px] focus:outline-none",
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

  async function handleInsertImage() {
    if (!dialogUrl.trim()) return;
    const rawUrl = normalizeUrl(dialogUrl);
    const needsResolving = /^https?:\/\/ibb\.co\//i.test(rawUrl);

    if (!needsResolving) {
      editor.chain().focus().setImage({ src: rawUrl }).run();
      setDialogUrl("");
      setImageError("");
      setImageDialogOpen(false);
      return;
    }

    setResolvingImage(true);
    setImageError("");

    let finalUrl = rawUrl;
    let resolved = true;
    try {
      const res = await fetch(`/api/resolve-image-url?url=${encodeURIComponent(rawUrl)}`);
      const data = await res.json();
      if (data?.url) finalUrl = data.url;
      resolved = data?.resolved !== false;
    } catch (e) {
      resolved = false;
    }

    setResolvingImage(false);

    if (!resolved) {
      setImageError(
        "Couldn't read that link automatically. On the ImgBB page, tap your image, then copy the link labeled \"Direct link\" (starts with i.ibb.co) and paste that instead."
      );
      return;
    }

    editor.chain().focus().setImage({ src: finalUrl }).run();
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

  const sizeOptions = [
    { label: "T1 — Large", run: () => editor.chain().focus().setTextSize("1.5em").run() },
    { label: "T2 — Medium", run: () => editor.chain().focus().setTextSize("1.25em").run() },
    { label: "T0 — Default", run: () => editor.chain().focus().unsetTextSize().run() },
  ];

  const alignOptions = [
    { label: "Left", value: "left" },
    { label: "Center", value: "center" },
    { label: "Right", value: "right" },
  ];

  const toolbar = (
    <div className="flex flex-wrap items-center gap-1.5">
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

      {/* Large text — inline style, can mix with normal text on the same line */}
      <div className="relative">
        <button
          type="button"
          title="Text size"
          onClick={() => {
            setAlignMenuOpen(false);
            setSizeMenuOpen((open) => !open);
          }}
          className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-border bg-card px-2 text-sm text-text-primary transition hover:bg-primary/5"
        >
          T
        </button>
        {sizeMenuOpen && (
          <div className="absolute left-0 top-9 z-20 w-36 rounded-xl border border-border bg-card p-1 shadow-lg">
            {sizeOptions.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  opt.run();
                  setSizeMenuOpen(false);
                }}
                className="block w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-text-primary hover:bg-primary/5"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Alignment — applies to the whole line/paragraph */}
      <div className="relative">
        <button
          type="button"
          title="Alignment"
          onClick={() => {
            setSizeMenuOpen(false);
            setAlignMenuOpen((open) => !open);
          }}
          className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-border bg-card px-2 text-sm text-text-primary transition hover:bg-primary/5"
        >
          ≡
        </button>
        {alignMenuOpen && (
          <div className="absolute left-0 top-9 z-20 w-32 rounded-xl border border-border bg-card p-1 shadow-lg">
            {alignOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  editor.chain().focus().setTextAlign(opt.value).run();
                  setAlignMenuOpen(false);
                }}
                className={`block w-full rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-primary/5 ${
                  editor.isActive("paragraph", { textAlign: opt.value })
                    ? "text-primary"
                    : "text-text-primary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

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
          setImageError("");
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

      {onToggleExpand && (
        <button
          type="button"
          onClick={onToggleExpand}
          className="ml-auto flex h-8 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-semibold text-text-primary transition hover:bg-primary/5"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      )}
    </div>
  );

  const dialogs = (
    <>
      {linkDialogOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center"
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
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => !resolvingImage && setImageDialogOpen(false)}
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
              placeholder="Paste any ImgBB link"
              className="mt-3 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
            {imageError && (
              <p className="mt-2 text-xs text-red-600">{imageError}</p>
            )}
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
                disabled={resolvingImage}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-primary disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleInsertImage}
                disabled={resolvingImage}
                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
              >
                {resolvingImage ? "Resolving…" : "Add Image"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (expanded) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-bg">
        <div className="flex-shrink-0 border-b border-border bg-card px-3 py-2">
          {toolbar}
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <EditorContent editor={editor} />
        </div>
        {footer && (
          <div className="flex-shrink-0 border-t border-border bg-card px-3 py-3">
            {footer}
          </div>
        )}
        {dialogs}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2">{toolbar}</div>
      <div className="rounded-xl border border-border bg-bg px-4 py-3">
        <EditorContent editor={editor} />
      </div>
      {dialogs}
    </div>
  );
}
