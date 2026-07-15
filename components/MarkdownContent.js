"use client";

import ReactMarkdown from "react-markdown";
import { isYoutubeUrl, toYoutubeEmbedUrl } from "@/lib/youtube";

// A YouTube link typed via the 🔗 tool (anywhere in the content, not just
// the dedicated Video Link field) renders as a real playable embed here.
// Anything else renders as a normal clickable brand-colored link.
export default function MarkdownContent({ children }) {
  return (
    <ReactMarkdown
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
