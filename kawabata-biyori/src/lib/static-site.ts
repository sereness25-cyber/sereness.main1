import type { Article, EventItem, Shop } from "./types";

/** GitHub Pages 用の静的書き出しのとき true。検索・絞り込みはブラウザ側（public/js/kawabata-site.js）で行う */
export const IS_STATIC = process.env.KAWABATA_STATIC === "1";

const norm = (s: string) => s.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
const strip = (html: string) => html.replace(/<[^>]+>/g, " ");

/** ブラウザ側の検索に使う文字（サーバー側の検索と同じ項目） */
export const articleText = (a: Article) =>
  norm([a.title, a.excerpt, strip(a.content), ...a.tags.map((t) => t.name), ...a.categories.map((c) => c.name)].join(" ")).slice(0, 6000);
export const shopText = (s: Shop) => norm(`${s.name} ${s.description} ${s.address}`);
export const eventText = (e: EventItem) => norm(`${e.title} ${e.venue} ${strip(e.content)}`).slice(0, 3000);
