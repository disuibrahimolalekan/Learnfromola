"use client";

import { formatQuotes } from "@/lib/formatContent";
import { toYoutubeEmbedUrl } from "@/lib/youtube";
import MarkdownContent from "@/components/MarkdownContent";

function stripQuiz(content) {
  const marker = content.indexOf("### Chapter Quiz");
  if (marker === -1) return content;
  return content.slice(0, marker).trim();
}

export default function ContentPreview({ eyebrow, title, videoUrl, content, isChapter = false }) {
  const displayContent = formatQuotes(
    isChapter ? stripQuiz(content || "") : content || ""
  );

  return (
    <div>
      {(eyebrow || title) && (
        <div className="mb-4">
          {eyebrow && (
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              {eyebrow}
            </span>
          )}
          {title && (
            <h1 className="mt-1 font-display text-2xl font-bold text-text-primary">
              {title}
            </h1>
          )}
        </div>
      )}

      {videoUrl && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-border shadow-sm">
          <div className="aspect-video w-full">
            <iframe
              src={toYoutubeEmbedUrl(videoUrl)}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      <div className="markdown-content rounded-2xl border border-border bg-card p-6 shadow-sm">
        <MarkdownContent>{displayContent}</MarkdownContent>
      </div>
    </div>
  );
}
