import { requireAdminPage } from "@/lib/admin/auth";
import { adminMedia } from "@/lib/admin/data";
import { AdminPage } from "@/components/admin/ui";
import { MediaLibrary } from "@/components/admin/MediaLibrary";

export const metadata = { title: "メディアライブラリ" };

export default async function MediaPage() {
  const admin = await requireAdminPage();
  return <AdminPage title="メディアライブラリ"><MediaLibrary initial={await adminMedia(admin, 500)} demo={!admin} /></AdminPage>;
}
