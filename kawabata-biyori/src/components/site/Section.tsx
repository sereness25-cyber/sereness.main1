import Link from "next/link";
import type { ReactNode } from "react";

/** 雑誌の章扉風の見出し */
export function SectionTitle({ en, ja, lead, href, linkLabel = "もっと見る" }: { en: string; ja: string; lead?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="rule-double mb-8 flex flex-wrap items-end justify-between gap-4 pt-4">
      <div className="min-w-0">
        <p className="font-en text-[2.2rem] italic leading-none text-navy md:text-[2.8rem]">{en}</p>
        <h2 className="headline mt-2 text-[1.1rem] text-navy">{ja}</h2>
        {lead && <p className="mt-1 text-sm text-muted">{lead}</p>}
      </div>
      {href && (
        <Link href={href} className="shrink-0 border-b border-navy pb-0.5 text-sm text-navy hover:text-rose-deep">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  // 個別に max-w-* を指定したときは、共通の最大幅を付けない（クラスの競合を避ける）
  const maxW = /(^|\s)max-w-/.test(className) ? "" : "max-w-[1200px]";
  return <div className={`mx-auto w-full ${maxW} px-4 md:px-6 ${className}`}>{children}</div>;
}

export function PageHeader({ en, title, lead, children }: { en: string; title: string; lead?: string; children?: ReactNode }) {
  return (
    <Container className="pt-8 md:pt-12">
      {children}
      <div className="rule-double grid gap-3 border-b border-navy/20 pb-8 pt-5 md:grid-cols-[1fr_auto] md:items-end">
        <div className="min-w-0">
          <p className="font-en text-[2.6rem] italic leading-none text-navy md:text-[4rem]">{en}</p>
          <h1 className="headline mt-3 text-[1.6rem] text-navy md:text-[2rem]">{title}</h1>
        </div>
        {lead && <p className="max-w-md text-[0.95rem] leading-8 text-muted">{lead}</p>}
      </div>
    </Container>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border-y border-navy/20 px-6 py-12 text-center">
      <p className="headline text-lg text-navy">{title}</p>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  );
}
