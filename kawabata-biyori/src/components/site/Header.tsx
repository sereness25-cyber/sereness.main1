"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV } from "@/lib/constants";
import { Logo } from "./Logo";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className={`sticky top-0 z-40 border-b transition-colors ${scrolled ? "border-beige bg-ivory/95 backdrop-blur" : "border-transparent bg-ivory"}`}>
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-6">
        <Logo />
        <nav aria-label="メインメニュー" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={isActive(n.href) ? "page" : undefined}
                  className={`rounded-full px-4 py-2 text-[0.92rem] font-medium transition-colors hover:bg-white ${isActive(n.href) ? "bg-white text-navy shadow-soft" : "text-ink"}`}
                >
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/search" className="ml-1 grid size-10 place-items-center rounded-full text-navy hover:bg-white" aria-label="サイト内検索">
                <SearchIcon />
              </Link>
            </li>
          </ul>
        </nav>
        <div className="flex items-center gap-1 lg:hidden">
          <Link href="/search" className="grid size-11 place-items-center rounded-full text-navy" aria-label="サイト内検索">
            <SearchIcon />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "メニューを閉じる" : "メニューを開く"}
            className="grid size-11 place-items-center rounded-full bg-white text-navy shadow-soft"
          >
            <span className="relative block h-3.5 w-5">
              <span className={`absolute left-0 h-0.5 w-5 rounded bg-current transition ${open ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 top-1.5 h-0.5 w-5 rounded bg-current transition ${open ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 h-0.5 w-5 rounded bg-current transition ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
            </span>
          </button>
        </div>
      </div>
      <div id="mobile-menu" hidden={!open} className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto bg-ivory px-5 pb-10 pt-4 lg:hidden">
        <ul className="space-y-2">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link href={n.href} className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 font-maru font-bold text-navy shadow-soft">
                {n.label}
                <span aria-hidden="true" className="text-rose">→</span>
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
              <Link href={href} className="block rounded-xl px-3 py-2 text-muted underline-offset-4 hover:underline">{label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
