import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiSettings } from "@/lib/types";

export const DEFAULT_AI_SETTINGS: AiSettings = {
  text_model: "claude-opus-5-5",
  effort: "medium",
  image_model: "gpt-image-2",
  daily_limit: 50,
};

export async function loadAiSettings(supabase: SupabaseClient): Promise<AiSettings> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", "ai").maybeSingle();
  return { ...DEFAULT_AI_SETTINGS, ...((data?.value as Partial<AiSettings>) ?? {}) };
}
