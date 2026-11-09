import { requireAdminPage } from "@/lib/admin/auth";
import { formatDateTime } from "@/lib/format";
import { AdminPage, Empty } from "@/components/admin/ui";
import { DeleteContactButton } from "./DeleteContactButton";

export const metadata = { title: "お問い合わせ" };

type Msg = { id: string; name: string; email: string; subject: string; body: string; created_at: string };

export default async function ContactAdmin() {
  const admin = await requireAdminPage();
  const items: Msg[] = admin ? ((await admin.supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200)).data ?? []) : [];
  return (
    <AdminPage title="お問い合わせ" lead="サイトのお問い合わせフォームから届いた内容です。">
      {items.length ? (
        <ul className="space-y-3">
          {items.map((m) => (
            <li key={m.id} className="rounded-2xl bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-navy">{m.subject || "（件名なし）"}</p>
                <span className="text-xs text-muted">{formatDateTime(m.created_at)}</span>
              </div>
              <p className="mt-1 text-sm">{m.name} ／ <a href={`mailto:${m.email}`} className="underline">{m.email}</a></p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{m.body}</p>
              <div className="mt-3 text-right"><DeleteContactButton id={m.id} /></div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>お問い合わせはまだありません。</Empty>
      )}
    </AdminPage>
  );
}
