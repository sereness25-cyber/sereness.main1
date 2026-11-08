import Link from "next/link";
import type { ReactNode } from "react";

export function SectionTitle({ en, ja, lead, href, linkLabel = "もっと見る" }: { en: string; ja: string; lead?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        <p className="font-en text-sm italic tracking-[0.25em] text-rose-deep">{en}</p>
        <h2 className="mt-1 text-[1.5rem] text-navy md:text-[1.75rem]">{ja}</h2>
        {lead && <p className="mt-2 text-sm text-muted">{lead}</p>}
      </div>
      {href && (
        <Link href={href} className="shrink-0 rounded-full border border-navy/20 px-4 py-2 text-sm text-navy transition hover:bg-white">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-4 md:px-6 ${className}`}>{children}</div>;
}

export function PageHeader({ en, title, lead, children }: { en: string; title: string; lead?: string; children?: ReactNode }) {
  return (
    <div className="bg-beige/60">
      <Container className="py-10 md:py-14">
        {children}
        <p className="font-en text-sm italic tracking-[0.3em] text-rose-deep">{en}</p>
        <h1 className="mt-1 text-[1.7rem] text-navy md:text-[2.2rem]">{title}</h1>
        {lead && <p className="mt-3 max-w-2xl text-[0.95rem] text-muted">{lead}</p>}
      </Container>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-rose/60 bg-white/60 px-6 py-12 text-center">
      <p className="font-maru text-lg font-bold text-navy">{title}</p>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  );
}
