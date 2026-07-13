import { supabase } from "@/lib/supabaseClient";
import { getCurrentCourseId } from "@/lib/currentCourse";

// Replaces the old static module list. Now that Admin can add or delete
// modules and chapters, the student-facing pages need to read the real,
// current list from Supabase instead of a hardcoded array.
export async function getModules() {
  const courseId = await getCurrentCourseId();
  if (!courseId) return [];

  const { data, error } = await supabase
    .from("modules")
    .select("number, title, chapters(count)")
    .eq("course_id", courseId)
    .order("number", { ascending: true });

  if (error) {
    console.error("Failed to load modules:", error.message);
    return [];
  }

  return (data || []).map((m) => ({
    number: m.number,
    title: m.title,
    chapterCount: m.chapters?.[0]?.count || 0,
  }));
}
