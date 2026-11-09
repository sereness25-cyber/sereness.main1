import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/auth";
import { adminShops } from "@/lib/admin/data";
import { shopCategoryLabel } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { AdminPage, Empty, btnPrimary } from "@/components/admin/ui";

export const metadata = { title: "店舗管理" };

export default async function ShopsAdmin() {
  const admin = await requireAdminPage();
  const shops = await adminShops(admin);
  return (
    <AdminPage title="店舗管理" lead="店舗情報は、お店に確認できた内容だけを登録してください。" actions={<Link href="/admin/shops/new" className={btnPrimary}>店舗を追加</Link>}>
      {shops.length ? (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-soft">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-[#eee6dc] text-left text-xs text-muted"><tr><th className="px-4 py-3">店舗名</th><th className="px-3">業種</th><th className="px-3">公開</th><th className="px-3">初心者歓迎</th><th className="px-3">最終確認日</th></tr></thead>
            <tbody className="divide-y divide-[#f1ebe3]">
              {shops.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3"><Link href={`/admin/shops/${s.id}`} className="font-bold text-navy hover:underline">{s.name}</Link></td>
                  <td className="px-3">{shopCategoryLabel(s.category)}</td>
                  <td className="px-3">{s.is_published ? "公開" : "非公開"}</td>
                  <td className="px-3">{s.beginner_welcome ? "○" : "—"}</td>
                  <td className="px-3 text-xs">{s.verified_at ? formatDate(s.verified_at) : <span className="text-[#b3263e]">未確認</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty href="/admin/shops/new" label="店舗を追加">まだ店舗が登録されていません。</Empty>
      )}
    </AdminPage>
  );
}
