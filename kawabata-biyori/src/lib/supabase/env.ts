export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

/** Supabase の接続情報があるか。ない場合はデモデータで表示する */
export function isSupabaseConfigured(): boolean {
  return supabaseEnv() !== null;
}
