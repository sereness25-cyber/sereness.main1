import { requireAdminPage } from "@/lib/admin/auth";
import { adminArticles, adminMedia } from "@/lib/admin/data";
import { imageConfigured } from "@/lib/ai/image";
import { AdminPage } from "@/components/admin/ui";
import { ImageStudio } from "@/components/admin/ImageStudio";

export const metadata = { title: "AI画像スタジオ" };

export default async function ImagesPage() {
  const admin = await requireAdminPage();
  const [media, articles] = await Promise.all([adminMedia(admin), adminArticles(admin)]);
  return (
    <AdminPage title="AI画像スタジオ" lead="記事のアイキャッチやSNS用の画像をAIで作ります。実在するお店や人物を紹介する記事では、AI画像を実際の写真として扱わないでください。">
      {!imageConfigured() && <p className="mb-4 rounded-xl bg-[#fdf1d8] px-4 py-3 text-sm">OPENAI_API_KEY が未設定のため、画像生成は使えません。</p>}
      <ImageStudio initial={media} articles={articles.filter((a) => !a.is_sample).map((a) => ({ id: a.id, title: a.title }))} demo={!admin} />
    </AdminPage>
  );
}
