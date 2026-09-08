"use client";

import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { isYoutubeUrl, toYoutubeEmbedUrl } from "@/lib/youtube";

// Allowed HTML tags and attributes for sanitized output.
// This prevents XSS while still allowing safe formatting (bold, italic,
// lists, images, links, quotes, and inline styles for alignment/size).
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    // Allow common formatting tags
    'p', 'br', 'strong', 'em', 'blockquote', 'img', 'a', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'code', 'pre',
    'hr', 'del', 'ins', 'sub', 'sup', 'mark',
  ],
  attributes: {
    ...defaultSchema.attributes,
    '*': ['style', 'className'],
    a: [...(defaultSchema.attributes?.a || []), 'target', 'rel'],
    img: [...(defaultSchema.attributes?.img || []), 'src', 'alt', 'title'],
  },
  // Strip dangerous tags entirely
  strip: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'svg', 'math'],
};

// rehypeRaw + rehypeSanitize lets safe formatting HTML render while
// stripping dangerous tags like <script>, <iframe>, etc.
export default function MarkdownContent({ children }) {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
      components={{
        a: ({ href, children: linkChildren }) => {
          if (isYoutubeUrl(href)) {
            return (
              <span className="my-4 block overflow-hidden rounded-2xl border border-border shadow-sm">
                <span className="block aspect-video w-full">
                  <iframe
                    src={toYoutubeEmbedUrl(href)}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </span>
              </span>
            );
          }
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:no-underline"
            >
              {linkChildren}
            </a>
          );
        },
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
