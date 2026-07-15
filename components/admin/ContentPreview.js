"use client";

import ReactMarkdown from "react-markdown";
import { formatQuotes } from "@/lib/formatContent";

function stripQuiz(content) {
  const marker = content.indexOf("### Chapter Quiz");
  if (marker === -1) return content;
  return content.slice(0, marker).trim();
}

// Renders markdown exactly the way students see it on the course site —
// same "markdown-content" wrapper and formatting pipeline as the Chapter
// Reader — so what an admin previews here is what students actually see.
// isChapter strips the quiz section, matching what the Chapter Reader does.
export default function ContentPreview({ content, isChapter = false }) {
  const displayContent = formatQuotes(
    isChapter ? stripQuiz(content || "") : content || ""
  );

  return (
    <div className="markdown-content rounded-2xl border border-border bg-card p-6 shadow-sm">
      <ReactMarkdown>{displayContent}</ReactMarkdown>
    </div>
  );
}
