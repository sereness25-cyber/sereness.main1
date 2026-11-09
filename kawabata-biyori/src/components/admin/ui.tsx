import Link from "next/link";
import type { ReactNode } from "react";

export const input = "w-full rounded-xl border border-[#dcd3c8] bg-white px-3 py-2.5 text-[0.95rem] focus:border-navy focus:outline-none";
export const btn = "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50";
export const btnPrimary = `${btn} bg-navy text-white hover:bg-navy-deep`;
export const btnSecondary = `${btn} border border-[#dcd3c8] bg-white text-navy hover:bg-ivory`;
export const btnDanger = `${btn} bg-[#b3263e] text-white hover:bg-[#8f1d31]`;
export const btnRose = `${btn} bg-rose-deep text-white hover:brightness-95`;

export function AdminPage({ title, actions, children, lead }: { title: string; actions?: ReactNode; children: ReactNode; lead?: string }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] text-navy">{title}</h1>
          {lead && <p className="mt-1 text-sm text-muted">{lead}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-white p-5 shadow-soft ${className}`}>
      {title && <h2 className="mb-3 text-base text-navy">{title}</h2>}
      {children}
    </section>
  );
}

export function Field({ label, hint, children, required }: { label: string; hint?: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-navy">
        {label}
        {required && <span className="ml-1 text-xs text-rose-deep">必須</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function StatusPill({ status, publishedAt }: { status: string; publishedAt?: string | null }) {
  const live = status === "scheduled" && publishedAt && new Date(publishedAt) <= new Date();
  const map: Record<string, [string, string]> = {
    draft: ["下書き", "bg-[#eee] text-[#555]"],
    published: ["公開", "bg-[#dff0e4] text-[#1f6b3a]"],
    scheduled: [live ? "公開（予約済）" : "予約公開", live ? "bg-[#dff0e4] text-[#1f6b3a]" : "bg-[#fdf1d8] text-[#8a5a00]"],
    private: ["非公開", "bg-[#f5e1e4] text-[#8a1c30]"],
  };
  const [label, cls] = map[status] ?? [status, ""];
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}>{label}</span>;
}

export function DemoNotice() {
  return (
    <div className="mb-6 rounded-2xl border border-dashed border-navy/40 bg-white px-5 py-4 text-sm leading-7">
      <strong className="text-navy">デモモード</strong>：Supabase が未接続のため、画面の確認だけができます。保存・AI生成・画像のアップロードは動きません。接続方法は README をご覧ください。
    </div>
  );
}

export function Empty({ children, href, label }: { children: ReactNode; href?: string; label?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#dcd3c8] bg-white px-6 py-10 text-center text-sm text-muted">
      {children}
      {href && <div className="mt-4"><Link href={href} className={btnPrimary}>{label}</Link></div>}
    </div>
  );
}
