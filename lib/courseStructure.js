import { supabase } from "@/lib/supabaseClient";
import { getCurrentCourseId } from "@/lib/currentCourse";

// Reads the real, current module list from Supabase (rather than a static
// file), so Admin's Add/Delete actions are reflected immediately on the
// student site. Chapter counts are computed from a separate plain query
// instead of Supabase's embedded-count shorthand, to avoid depending on
// its schema cache being freshly refreshed after structural changes.
export async function getModules() {
  const courseId = await getCurrentCourseId();
  if (!courseId) return [];

  const [modulesResult, chaptersResult] = await Promise.all([
    supabase
      .from("modules")
      .select("number, title")
      .eq("course_id", courseId)
      .order("number", { ascending: true }),
    supabase
      .from("chapters")
      .select("module_number")
      .eq("course_id", courseId),
  ]);

  if (modulesResult.error) {
    console.error("Failed to load modules:", modulesResult.error.message);
    return [];
  }
  if (chaptersResult.error) {
    console.error("Failed to load chapters:", chaptersResult.error.message);
  }

  const countByModule = {};
  (chaptersResult.data || []).forEach((row) => {
    countByModule[row.module_number] = (countByModule[row.module_number] || 0) + 1;
  });

  return (modulesResult.data || []).map((m) => ({
    number: m.number,
    title: m.title,
    chapterCount: countByModule[m.number] || 0,
  }));
}
