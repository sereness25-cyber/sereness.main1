import Link from "next/link";
import { getSiteSettings } from "@/lib/data";
import { SITE } from "@/lib/constants";
import { Logo } from "./Logo";

export async function Footer() {
  const s = await getSiteSettings();
  const sns = [
    { key: "instagram", label: "Instagram", url: s.instagram },
    { key: "x", label: "X", url: s.x },
    { key: "facebook", label: "Facebook", url: s.facebook },
    { key: "youtube", label: "YouTube", url: s.youtube },
  ].filter((x) => x.url);

  return (
    <footer className="mt-24 bg-navy text-white">
      <div className="mx-auto max-w-[1200px] px-5 py-14 md:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo light />
            <p className="mt-4 max-w-sm text-sm leading-7 text-white/80">{SITE.description}</p>
            {sns.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {sns.map((x) => (
                  <li key={x.key}>
                    <a href={x.url} target="_blank" rel="noopener noreferrer" className="inline-block rounded-full border border-white/30 px-4 py-1.5 text-sm hover:bg-white/10">
                      {x.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <nav aria-label="フッターメニュー" className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
            {[
              ["/articles", "記事を読む"],
              ["/shops", "お店を探す"],
              ["/guide", "はじめての川反"],
              ["/events", "イベント"],
              ["/map", "川反マップ"],
              ["/search", "サイト内検索"],
              ["/about", "メディアについて"],
              ["/contact", "お問い合わせ"],
              ["/company", "運営者情報"],
              ["/privacy", "プライバシーポリシー"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="py-1 text-white/85 underline-offset-4 hover:underline">
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-12 border-t border-white/15 pt-6 text-xs text-white/60">
          © {SITE.name} ／ 運営：{SITE.operator}
        </p>
      </div>
    </footer>
  );
}
