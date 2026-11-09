import { requireAdminPage } from "@/lib/admin/auth";
import { AdminPage } from "@/components/admin/ui";
import { SiteSettingsForm } from "@/components/admin/SettingsForms";
import type { SiteSettings } from "@/lib/types";

export const metadata = { title: "サイト設定" };

export default async function SettingsPage() {
  const admin = await requireAdminPage();
  let value: SiteSettings = { instagram: "", x: "", facebook: "", youtube: "" };
  if (admin) {
    const { data } = await admin.supabase.from("site_settings").select("value").eq("key", "site").maybeSingle();
    value = { ...value, ...((data?.value as Partial<SiteSettings>) ?? {}) };
  }
  return (
    <AdminPage title="サイト設定" lead="サイト名やキャッチコピーは src/lib/constants.ts、運営者情報は src/app/(site)/company/page.tsx で変更します。">
      <SiteSettingsForm initial={value} demo={!admin} />
    </AdminPage>
  );
}
