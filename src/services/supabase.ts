import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { safeAsyncStorage } from "@/storage/safeAsyncStorage";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

function isValidSupabaseUrl(value: string) {
  return /^https:\/\/.+\.supabase\.co$/i.test(value);
}

export const supabaseConfigWarning = isValidSupabaseUrl(supabaseUrl)
  ? null
  : "EXPO_PUBLIC_SUPABASE_URL precisa ser uma URL https://*.supabase.co. O app abre com cache/local vazio ate a URL real ser configurada.";

export const supabase: SupabaseClient<Database> | null = isValidSupabaseUrl(supabaseUrl)
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: safeAsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          "x-client-info": "nossa-pelada-mobile"
        }
      }
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigWarning ?? "Supabase nao configurado.");
  }
  return supabase;
}
