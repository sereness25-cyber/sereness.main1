import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/auth";
import { adminEvents } from "@/lib/admin/data";
import { formatEventDate } from "@/lib/format";
import { isEventPast } from "@/lib/data";
import { AdminPage, Empty, btnPrimary } from "@/components/admin/ui";

export const metadata = { title: "イベント管理" };

export default async function EventsAdmin() {
  const admin = await requireAdminPage();
  const events = await adminEvents(admin);
  return (
    <AdminPage title="イベント管理" actions={<Link href="/admin/events/new" className={btnPrimary}>イベントを追加</Link>}>
      {events.length ? (
        <ul className="divide-y divide-[#f1ebe3] rounded-2xl bg-white shadow-soft">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <Link href={`/admin/events/${e.id}`} className="font-bold text-navy hover:underline">{e.title}</Link>
              <span className="flex items-center gap-2 text-xs text-muted">
                {formatEventDate(e.starts_at, e.ends_at)}
                <span className={`rounded-full px-2 py-0.5 ${isEventPast(e) ? "bg-[#eee]" : "bg-[#dff0e4] text-[#1f6b3a]"}`}>{isEventPast(e) ? "終了" : "開催予定"}</span>
                <span>{e.is_published ? "公開" : "非公開"}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <Empty href="/admin/events/new" label="イベントを追加">まだイベントが登録されていません。</Empty>
      )}
    </AdminPage>
  );
}
