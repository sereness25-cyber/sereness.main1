import { requireAdminPage } from "@/lib/admin/auth";
import { adminTags } from "@/lib/admin/data";
import { AdminPage } from "@/components/admin/ui";
import { TagManager } from "@/components/admin/TaxonomyManagers";

export const metadata = { title: "タグ管理" };

export default async function TagsPage() {
  const admin = await requireAdminPage();
  return <AdminPage title="タグ管理" lead="数字は使われている記事の数です。"><TagManager tags={await adminTags(admin)} demo={!admin} /></AdminPage>;
}
