import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn(
    "Supabase admin client is missing env vars. Add SUPABASE_SERVICE_ROLE_KEY in Vercel (server-side only, do not prefix with NEXT_PUBLIC_)."
  );
}

// Create client only if both values are present; otherwise export a stub
// to prevent build-time crashes when env vars are unavailable.
let supabaseAdminInstance;
if (supabaseUrl && serviceRoleKey) {
  supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey);
} else {
  // Stub client for build-time (env vars not available during static generation)
  supabaseAdminInstance = {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
      }),
      insert: async () => ({ data: null, error: { message: "Not configured" } }),
      update: async () => ({ data: null, error: { message: "Not configured" } }),
      delete: async () => ({ data: null, error: { message: "Not configured" } }),
    }),
  };
}

export { supabaseAdminInstance as supabaseAdmin };
