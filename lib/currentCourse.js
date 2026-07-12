import { supabase } from "@/lib/supabaseClient";

// Lean, single-course approach: this deployed site only ever serves one
// course, so we resolve it once by its known slug rather than building
// full multi-course routing (which becomes relevant once a second course
// actually exists to route between).
const COURSE_SLUG = "ai-software-builder";

export async function getCurrentCourseId() {
  const { data, error } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", COURSE_SLUG)
    .maybeSingle();

  if (error) {
    console.error("Failed to resolve current course:", error.message);
    return null;
  }
  return data?.id || null;
}
