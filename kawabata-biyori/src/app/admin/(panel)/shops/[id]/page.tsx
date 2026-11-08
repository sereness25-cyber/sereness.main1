import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/auth";
import { adminShop } from "@/lib/admin/data";
import { AdminPage } from "@/components/admin/ui";
import { ShopForm } from "@/components/admin/ShopForm";

export const metadata = { title: "店舗の編集" };

export default async function EditShop({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminPage();
  const shop = await adminShop(admin, (await params).id);
  if (!shop) notFound();
  return <AdminPage title="店舗の編集"><ShopForm key={shop.id} shop={shop} demo={!admin} /></AdminPage>;
}
