import "server-only";
import { AdminError, type AdminSession } from "@/lib/admin/auth";
import type { AiSettings } from "@/lib/types";

/**
 * AI利用の共通ガード。
 * - 1日の上限回数（AI設定）を超えたら止める
 * - 同じ管理者の生成が実行中なら二重送信として止める
 * - 利用履歴（ai_generation_logs）を記録する
 */
export async function startAiJob(admin: AdminSession, kind: string, settings: AiSettings, model: string) {
  const { supabase, user } = admin;
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await supabase
    .from("ai_generation_logs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  if ((count ?? 0) >= settings.daily_limit) {
    throw new AdminError(`AIの利用回数が1日の上限（${settings.daily_limit}回）に達しました。AI設定で変更できます。`, 429);
  }
  const recent = new Date(Date.now() - 3 * 60 * 1000).toISOString();
  const { data: running } = await supabase
    .from("ai_generation_logs")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "running")
    .gte("created_at", recent)
    .limit(1);
  if (running?.length) throw new AdminError("前の生成がまだ終わっていません。完了してからもう一度お試しください。", 409);

  const { data: log, error } = await supabase
    .from("ai_generation_logs")
    .insert({ user_id: user.id, kind, model, status: "running" })
    .select("id")
    .single();
  if (error) throw new AdminError(`利用履歴を記録できませんでした: ${error.message}`, 500);

  return {
    async succeed(usage?: { input_tokens?: number; output_tokens?: number }) {
      await supabase
        .from("ai_generation_logs")
        .update({ status: "succeeded", finished_at: new Date().toISOString(), input_tokens: usage?.input_tokens ?? null, output_tokens: usage?.output_tokens ?? null })
        .eq("id", log.id);
    },
    async fail(message: string) {
      await supabase.from("ai_generation_logs").update({ status: "failed", finished_at: new Date().toISOString(), error: message.slice(0, 500) }).eq("id", log.id);
    },
  };
}
