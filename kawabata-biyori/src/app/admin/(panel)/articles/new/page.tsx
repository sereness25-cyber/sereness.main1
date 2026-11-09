import { requireAdminPage } from "@/lib/admin/auth";
import { AdminPage } from "@/components/admin/ui";
import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { editorOptions } from "../editorData";

export const metadata = { title: "新規記事" };

export default async function NewArticle() {
  const admin = await requireAdminPage();
  const opts = await editorOptions(admin);
  return (
    <AdminPage title="新規記事">
      <ArticleEditor article={null} {...opts} demo={!admin} />
    </AdminPage>
  );
}
