import { requireAdminPage } from "@/lib/admin/auth";
import { AdminPage } from "@/components/admin/ui";
import { EventForm } from "@/components/admin/EventForm";

export const metadata = { title: "イベントを追加" };

export default async function NewEvent() {
  const admin = await requireAdminPage();
  return <AdminPage title="イベントを追加"><EventForm event={null} demo={!admin} /></AdminPage>;
}
