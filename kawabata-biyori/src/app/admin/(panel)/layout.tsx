import { AdminNav } from "@/components/admin/AdminNav";
import { DemoNotice } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  return (
    <div className="md:flex">
      <AdminNav email={admin?.user.email ?? null} />
      <div className="min-w-0 flex-1">
        {!admin && <div className="mx-auto max-w-6xl px-4 pt-6 md:px-8"><DemoNotice /></div>}
        {children}
      </div>
    </div>
  );
}
