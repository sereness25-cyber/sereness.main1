import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/auth";
import { adminArticle } from "@/lib/admin/data";
import { AdminPage } from "@/components/admin/ui";
import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { editorOptions } from "../editorData";

export const metadata = { title: "記事の編集" };

export default async function EditArticle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdminPage();
  const [article, opts] = await Promise.all([adminArticle(admin, id), editorOptions(admin)]);
  if (!article) notFound();
  return (
    <AdminPage title="記事の編集">
      <ArticleEditor key={article.id} article={article} {...opts} demo={!admin} />
    </AdminPage>
  );
}
