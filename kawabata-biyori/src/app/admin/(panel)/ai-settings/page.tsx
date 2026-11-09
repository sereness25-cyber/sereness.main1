import { requireAdminPage } from "@/lib/admin/auth";
import { DEFAULT_AI_SETTINGS, loadAiSettings } from "@/lib/ai/settings";
import { claudeConfigured } from "@/lib/ai/claude";
import { imageConfigured } from "@/lib/ai/image";
import { formatDateTime } from "@/lib/format";
import { AdminPage, Panel } from "@/components/admin/ui";
import { AiSettingsForm } from "@/components/admin/SettingsForms";

export const metadata = { title: "AI設定" };

const KIND: Record<string, string> = { outline: "構成", body: "本文", seo: "SEO", rewrite: "リライト", image: "画像" };

export default async function AiSettingsPage() {
  const admin = await requireAdminPage();
  const settings = admin ? await loadAiSettings(admin.supabase) : DEFAULT_AI_SETTINGS;
  const logs = admin
    ? (await admin.supabase.from("ai_generation_logs").select("*").order("created_at", { ascending: false }).limit(30)).data ?? []
    : [];
  const ok = (v: boolean) => (v ? <span className="font-bold text-[#1f6b3a]">設定済み</span> : <span className="font-bold text-[#b3263e]">未設定</span>);
  return (
    <AdminPage title="AI設定" lead="APIキーはサーバーの環境変数でだけ管理し、画面には表示しません。">
      <div className="grid gap-6">
        <Panel title="APIキーの状態">
          <ul className="space-y-1 text-sm">
            <li>文章生成（ANTHROPIC_API_KEY）：{ok(claudeConfigured())}</li>
            <li>画像生成・編集（OPENAI_API_KEY）：{ok(imageConfigured())}</li>
          </ul>
        </Panel>
        <AiSettingsForm initial={settings} demo={!admin} />
        <Panel title="利用履歴（最新30件）">
          {logs.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-left text-xs text-muted"><tr><th className="py-2">日時</th><th>種類</th><th>モデル</th><th>結果</th><th>トークン（入/出）</th></tr></thead>
                <tbody className="divide-y divide-[#f1ebe3]">
                  {logs.map((l) => (
                    <tr key={l.id}>
                      <td className="py-2 text-xs">{formatDateTime(l.created_at)}</td>
                      <td>{KIND[l.kind] ?? l.kind}</td>
                      <td className="text-xs">{l.model}</td>
                      <td className="text-xs">{l.status === "succeeded" ? "成功" : l.status === "failed" ? <span title={l.error ?? ""} className="text-[#b3263e]">失敗：{l.error}</span> : "実行中"}</td>
                      <td className="text-xs">{l.input_tokens ?? "—"} / {l.output_tokens ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted">まだ利用履歴はありません。</p>
          )}
        </Panel>
      </div>
    </AdminPage>
  );
}
