import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/auth";
import { adminEvent } from "@/lib/admin/data";
import { AdminPage } from "@/components/admin/ui";
import { EventForm } from "@/components/admin/EventForm";

export const metadata = { title: "イベントの編集" };

export default async function EditEvent({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminPage();
  const event = await adminEvent(admin, (await params).id);
  if (!event) notFound();
  return <AdminPage title="イベントの編集"><EventForm key={event.id} event={event} demo={!admin} /></AdminPage>;
}
