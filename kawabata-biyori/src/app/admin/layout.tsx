import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "管理画面", template: "%s｜かわばた日和 管理" }, robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="min-h-svh bg-[#f4f1ec]">{children}</div>;
}
