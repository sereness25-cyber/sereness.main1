import { requireAdminPage } from "@/lib/admin/auth";
import { adminCategories } from "@/lib/admin/data";
import { claudeConfigured } from "@/lib/ai/claude";
import { AdminPage } from "@/components/admin/ui";
import { AiWriter } from "@/components/admin/AiWriter";

export const metadata = { title: "AI記事作成" };

export default async function AiPage() {
  const admin = await requireAdminPage();
  const categories = await adminCategories(admin);
  return (
    <AdminPage title="AI記事作成" lead="テーマを入れると、構成・本文・SEO情報・SNS投稿文・アイキャッチ画像を順に作ります。生成内容は下書きとして保存され、自動公開はされません。">
      {!claudeConfigured() && <p className="mb-4 rounded-xl bg-[#fdf1d8] px-4 py-3 text-sm">ANTHROPIC_API_KEY が未設定です。AI設定のページで設定状況を確認できます。</p>}
      <AiWriter categories={categories.map((c) => c.name)} demo={!admin} />
    </AdminPage>
  );
}
