"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabaseClient";
import { formatQuotes } from "@/lib/formatContent";
import { getCurrentCourseId } from "@/lib/currentCourse";
import FlowChart from "@/components/ui/FlowChart";

function stripQuiz(content) {
  const marker = content.indexOf("### Chapter Quiz");
  if (marker === -1) return content;
  return content.slice(0, marker).trim();
}

export default function ChapterReaderPage() {
  const router = useRouter();
  const params = useParams();
  const moduleNumber = Number(params.moduleNumber);
  const chapterNumber = Number(params.chapterNumber);

  const [checking, setChecking] = useState(true);
  const [chapter, setChapter] = useState(null);
  const [moduleHasIntro, setModuleHasIntro] = useState(false);
  const [siblingChapterNumbers, setSiblingChapterNumbers] = useState([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const courseId = await getCurrentCourseId();
      if (!courseId) {
        setNotFound(true);
        setChecking(false);
        return;
      }

      const [chapterResult, moduleResult, siblingsResult] = await Promise.all([
        supabase
          .from("chapters")
          .select("chapter_number, title, content, video_url")
          .eq("course_id", courseId)
          .eq("module_number", moduleNumber)
          .eq("chapter_number", chapterNumber)
          .maybeSingle(),
        supabase
          .from("modules")
          .select("intro_content")
          .eq("course_id", courseId)
          .eq("number", moduleNumber)
          .maybeSingle(),
        supabase
          .from("chapters")
          .select("chapter_number")
          .eq("course_id", courseId)
          .eq("module_number", moduleNumber)
          .order("chapter_number", { ascending: true }),
      ]);

      if (!chapterResult.data) {
        setNotFound(true);
        setChecking(false);
        return;
      }

      setChapter(chapterResult.data);
      setModuleHasIntro(Boolean(moduleResult.data?.intro_content));
      setSiblingChapterNumbers(
        (siblingsResult.data || []).map((c) => c.chapter_number)
      );
      setChecking(false);

      const { data: existing } = await supabase
        .from("progress")
        .select("chapter_number")
        .eq("user_id", session.user.id)
        .eq("module_number", moduleNumber)
        .eq("chapter_number", chapterNumber)
        .maybeSingle();

      if (!existing) {
        const { error: insertError } = await supabase.from("progress").insert({
          user_id: session.user.id,
          module_number: moduleNumber,
          chapter_number: chapterNumber,
        });
        if (insertError) {
          console.error("Failed to save progress:", insertError.message);
        }
      }
    }

    load();
  }, [moduleNumber, chapterNumber, router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm text-text-secondary">Loading…</p>
      </div>
    );
  }

  if (notFound || !chapter) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
        <p className="text-sm text-text-secondary">
          We couldn&apos;t find that chapter.
        </p>
        <Link
          href={`/module/${moduleNumber}`}
          className="rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          Back to Module
        </Link>
      </div>
    );
  }

  // Determine true first/last and previous/next based on the actual
  // chapters that exist, not assumed sequential numbering — this stays
  // correct even if a chapter in the middle has been deleted.
  const currentIndex = siblingChapterNumbers.indexOf(chapterNumber);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === siblingChapterNumbers.length - 1;
  const previousChapterNumber =
    currentIndex > 0 ? siblingChapterNumbers[currentIndex - 1] : null;
  const nextChapterNumber =
    currentIndex < siblingChapterNumbers.length - 1
      ? siblingChapterNumbers[currentIndex + 1]
      : null;

  const showPrevious = !isFirst || (isFirst && moduleHasIntro);
  const previousHref =
    isFirst && moduleHasIntro
      ? `/module/${moduleNumber}/intro`
      : `/module/${moduleNumber}/chapter/${previousChapterNumber}`;

  const displayContent = formatQuotes(stripQuiz(chapter.content));

  return (
    <div className="min-h-screen bg-bg pb-28">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href={`/module/${moduleNumber}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to Module {moduleNumber}
        </Link>

        <div className="mt-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            Chapter {chapterNumber}
          </span>
          <h1 className="mt-1 font-display text-2xl font-bold text-text-primary">
            {chapter.title}
          </h1>
        </div>

        {moduleNumber === 2 && chapterNumber === 3 && (
          <FlowChart
            title="Example: Online Store User Flow"
            steps={[
              "Visit Homepage",
              "Browse Products",
              "Add to Cart",
              "Checkout",
              "Make Payment",
              "Receive Order Confirmation",
            ]}
          />
        )}

        {chapter.video_url && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-border shadow-sm">
            <div className="aspect-video w-full">
              <iframe
                src={chapter.video_url}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        <div className="markdown-content mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <ReactMarkdown>{displayContent}</ReactMarkdown>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-stretch justify-between gap-2">
          {showPrevious ? (
            <Link
              href={previousHref}
              className="flex flex-1 items-center justify-center whitespace-nowrap rounded-xl border border-border bg-card px-3 py-2.5 text-center text-sm font-medium text-text-primary transition hover:bg-primary/5 active:bg-primary/10"
            >
              ← Previous
            </Link>
          ) : (
            <span className="flex-1" />
          )}

          <Link
            href="/dashboard"
            className="flex flex-1 items-center justify-center whitespace-nowrap rounded-xl border border-border bg-card px-3 py-2.5 text-center text-sm font-medium text-text-primary transition hover:bg-primary/5 active:bg-primary/10"
          >
            Home
          </Link>

          {!isLast ? (
            <Link
              href={`/module/${moduleNumber}/chapter/${nextChapterNumber}`}
              className="flex flex-1 items-center justify-center whitespace-nowrap rounded-xl bg-gradient-to-r from-primary to-secondary px-3 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:shadow-md hover:brightness-105"
            >
              Next →
            </Link>
          ) : (
            <span className="flex-1" />
          )}
        </div>
      </div>
    </div>
  );
                }
