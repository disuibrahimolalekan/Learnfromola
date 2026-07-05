import { createClient } from "@supabase/supabase-js";

// These come from your Supabase project settings (Project Settings > API).
// They are safe to expose on the client — Supabase's Row Level Security
// policies are what actually protect your data.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly in development instead of a confusing runtime error later.
  console.warn(
    "Supabase environment variables are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
