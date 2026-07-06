import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn(
    "Supabase admin client is missing env vars. Add SUPABASE_SERVICE_ROLE_KEY in Vercel (server-side only, do not prefix with NEXT_PUBLIC_)."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
