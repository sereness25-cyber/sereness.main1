import { requireAdminPage } from "@/lib/admin/auth";
import { adminCategories } from "@/lib/admin/data";
import { AdminPage } from "@/components/admin/ui";
import { CategoryManager } from "@/components/admin/TaxonomyManagers";

export const metadata = { title: "カテゴリー管理" };

export default async function CategoriesPage() {
  const admin = await requireAdminPage();
  return <AdminPage title="カテゴリー管理" lead="▲▼で並び順を変えられます。記事には複数のカテゴリーを設定できます。"><CategoryManager categories={await adminCategories(admin)} demo={!admin} /></AdminPage>;
}
