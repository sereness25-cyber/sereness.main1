import { requireAdminPage } from "@/lib/admin/auth";
import { AdminPage } from "@/components/admin/ui";
import { ShopForm } from "@/components/admin/ShopForm";

export const metadata = { title: "店舗を追加" };

export default async function NewShop() {
  const admin = await requireAdminPage();
  return <AdminPage title="店舗を追加"><ShopForm shop={null} demo={!admin} /></AdminPage>;
}
