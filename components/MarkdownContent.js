"use client";

import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { isYoutubeUrl, toYoutubeEmbedUrl } from "@/lib/youtube";

// rehypeRaw lets the large-text and alignment features (which are saved
// as small inline HTML snippets) actually render, instead of showing up
// as literal text. Bold, italic, lists, images, links, quotes are all
// unaffected — those still save as plain, clean markdown.
export default function MarkdownContent({ children }) {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeRaw]}
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
