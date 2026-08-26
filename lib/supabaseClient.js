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

// Create client only if both values are present; otherwise export a stub
// to prevent build-time crashes when env vars are unavailable.
let supabaseInstance;
if (supabaseUrl && supabaseAnonKey) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Stub client for build-time (env vars not available during static generation)
  supabaseInstance = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: null, error: { message: "Not configured" } }),
      signUp: async () => ({ data: null, error: { message: "Not configured" } }),
      signOut: async () => ({ error: null }),
      updateUser: async () => ({ data: null, error: { message: "Not configured" } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null, error: null }), limit: async () => ({ data: [], error: null }) }),
        order: () => ({ data: [], error: null }),
      }),
      insert: async () => ({ data: null, error: { message: "Not configured" } }),
      update: async () => ({ data: null, error: { message: "Not configured" } }),
      delete: async () => ({ data: null, error: { message: "Not configured" } }),
      rpc: async () => ({ data: null, error: null }),
    }),
  };
}

export { supabaseInstance as supabase };
