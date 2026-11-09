"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MENU_EXTRA, NAV } from "@/lib/constants";

export type IssueLabel = { vol: number; en: string } | null;

function Sakura({ className = "" }: { className?: string }) {
  const flower = (x: number, y: number, r: number) => (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy={-r} rx={r * 0.62} ry={r} fill="#eeb3c0" transform={`rotate(${a})`} />
      ))}
      <circle r={r * 0.32} fill="#c9768a" />
    </g>
  );
  return (
    <svg viewBox="0 0 90 70" className={className} aria-hidden="true">
      <path d="M86 4C70 12 56 22 46 34S28 56 6 66" fill="none" stroke="#8a5a52" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M58 22c4-6 10-9 16-9M38 44c-6-2-11-1-15 2" fill="none" stroke="#8a5a52" strokeWidth="1.2" strokeLinecap="round" />
      {flower(72, 12, 5)}
      {flower(52, 28, 6)}
      {flower(30, 47, 5)}
      {flower(64, 30, 3.5)}
      {flower(18, 58, 3.5)}
      <circle cx="43" cy="20" r="2" fill="#eeb3c0" />
      <circle cx="80" cy="24" r="1.6" fill="#eeb3c0" />
    </svg>
  );
}

export function Header({ issue }: { issue: IssueLabel }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="bg-ivory">
        <div className="mx-auto grid max-w-[1200px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 pb-3 pt-4 md:px-6 md:pt-6">
          <p className="whitespace-nowrap font-mincho text-[0.5rem] leading-[1.75] tracking-wide text-ink sm:text-[0.62rem] md:text-[0.78rem]">
            秋田・川反のまちの
            <br />
            人・お店・お酒・
            <br className="md:hidden" />
            物語をつづる
            <br />
            Webマガジン
          </p>

          <Link href="/" className="relative text-center" aria-label="かわばた日和 ホーム">
            <span className="block font-mincho text-[1.75rem] font-medium leading-none tracking-[0.06em] text-ink sm:text-[2.2rem] md:text-[3rem]">かわばた日和</span>
            <span className="mt-2 block font-en text-[0.55rem] tracking-[0.42em] text-ink md:text-[0.8rem]">KAWABATA BIYORI</span>
            <svg viewBox="0 0 120 12" className="absolute -bottom-2 right-0 h-2.5 w-16 md:w-24" aria-hidden="true">
              <path d="M2 9C30 10 70 8 118 2" fill="none" stroke="#c9768a" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </Link>

          <div className="relative flex items-start justify-end gap-1">
            <Sakura className="pointer-events-none absolute -top-3 right-14 hidden w-16 sm:block md:right-20 md:w-24" />
            {issue && (
              <Link href="/issues" className="relative mt-1 text-right leading-tight text-navy">
                <span className="block font-en text-[0.95rem] italic md:text-[1.4rem]">
                  VOL.<span className="text-[1.25em]">{String(issue.vol).padStart(2, "0")}</span>
                </span>
                <span className="block font-en text-[0.6rem] italic md:text-[0.8rem]">{issue.en}</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "メニューを閉じる" : "メニューを開く"}
              className="grid size-10 shrink-0 place-items-center text-ink"
            >
              <span className="relative block h-4 w-6">
                <span className={`absolute left-0 h-[2px] w-6 bg-current transition ${open ? "top-[7px] rotate-45" : "top-0"}`} />
                <span className={`absolute left-0 top-[7px] h-[2px] w-6 bg-current transition ${open ? "opacity-0" : ""}`} />
                <span className={`absolute left-0 h-[2px] w-6 bg-current transition ${open ? "top-[7px] -rotate-45" : "top-[14px]"}`} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <nav aria-label="メインメニュー" className="sticky top-0 z-40 border-y border-navy/10 bg-ivory/95 backdrop-blur">
        <ul className="mx-auto flex max-w-[900px] justify-between overflow-x-auto px-3 md:px-6">
          {NAV.map((n) => (
            <li key={n.href} className="shrink-0">
              <Link
                href={n.href}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={`block border-b-2 px-1 py-3 font-mincho text-[0.8rem] font-bold tracking-[0.06em] transition-colors sm:px-2 sm:text-[0.92rem] sm:tracking-[0.12em] md:px-4 md:text-base ${isActive(n.href) ? "border-blush text-ink" : "border-transparent text-ink hover:text-blush"}`}
              >
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div id="mobile-menu" hidden={!open} className="fixed inset-0 z-50 overflow-y-auto bg-ivory px-6 pb-10 pt-5">
        <div className="flex items-center justify-between">
          <span className="font-mincho text-xl">かわばた日和</span>
          <button type="button" onClick={() => setOpen(false)} className="grid size-11 place-items-center text-2xl" aria-label="メニューを閉じる">×</button>
        </div>
        <ul className="mt-6 border-t border-navy/15">
          {[...NAV, ...MENU_EXTRA].map((n) => (
            <li key={n.href}>
              <Link href={n.href} className="flex items-center justify-between border-b border-navy/15 py-4 font-mincho text-lg font-bold text-ink">
                {n.label}
                <span aria-hidden="true" className="text-blush">→</span>
              </Link>
            </li>
          ))}
        </ul>
        <ul className="mt-6 grid grid-cols-2 gap-2 text-sm">
          {[
            ["/about", "メディアについて"],
            ["/contact", "お問い合わせ"],
            ["/company", "運営者情報"],
            ["/privacy", "プライバシーポリシー"],
          ].map(([href, label]) => (
            <li key={href}>
              <Link href={href} className="block py-2 text-muted underline-offset-4 hover:underline">{label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
