import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export function getSupabaseClient(url?: string, anonKey?: string) {
  const supabaseUrl =
    url ||
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    (typeof process !== "undefined" && process.env.EXPO_PUBLIC_SUPABASE_URL) ||
    "https://placeholder.supabase.co";

  const supabaseKey =
    anonKey ||
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    (typeof process !== "undefined" && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) ||
    "placeholder-key";

  return createSupabaseClient<Database>(supabaseUrl, supabaseKey);
}
