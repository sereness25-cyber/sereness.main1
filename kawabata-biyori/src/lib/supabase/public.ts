import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

let cached: SupabaseClient | null = null;

/** 公開ページ用。Cookie を使わない匿名クライアントで、RLS により公開データだけが読める */
export function publicClient(): SupabaseClient {
  const env = supabaseEnv();
  if (!env) throw new Error("Supabase is not configured");
  cached ??= createClient(env.url, env.anonKey, { auth: { persistSession: false } });
  return cached;
}
