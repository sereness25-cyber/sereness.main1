import "server-only";
import { NextResponse } from "next/server";
import { AdminError, requireAdmin, type AdminSession } from "@/lib/admin/auth";
import { loadAiSettings } from "./settings";
import { startAiJob } from "./guard";
import type { AiSettings } from "@/lib/types";

type Ctx = { admin: AdminSession; settings: AiSettings };
type Handler = (ctx: Ctx, body: unknown) => Promise<{ result: unknown; usage?: { input_tokens: number; output_tokens: number } }>;

/** AI API の共通処理：管理者確認 → 上限・二重送信チェック → 実行 → 履歴記録 → JSON応答 */
export function aiRoute(kind: string, model: (s: AiSettings) => string, handler: Handler) {
  return async function POST(req: Request) {
    let job: Awaited<ReturnType<typeof startAiJob>> | null = null;
    try {
      const admin = await requireAdmin();
      const settings = await loadAiSettings(admin.supabase);
      const body = await req.json().catch(() => {
        throw new AdminError("リクエストの形式が正しくありません。", 400);
      });
      job = await startAiJob(admin, kind, settings, model(settings));
      const { result, usage } = await handler({ admin, settings }, body);
      await job.succeed(usage);
      return NextResponse.json(result);
    } catch (e) {
      const message = e instanceof AdminError ? e.message : "AIの処理中にエラーが発生しました。";
      const status = e instanceof AdminError ? e.status : 500;
      if (!(e instanceof AdminError)) console.error(e);
      await job?.fail(message);
      return NextResponse.json({ error: message }, { status });
    }
  };
}
