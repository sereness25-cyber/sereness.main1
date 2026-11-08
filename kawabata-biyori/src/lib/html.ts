import sanitizeHtml from "sanitize-html";

/** 記事本文として保存・表示してよいHTMLだけを残す（XSS対策） */
export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "h2", "h3", "h4", "p", "br", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li",
      "blockquote", "img", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td",
      "hr", "div", "span", "code", "pre", "colgroup", "col",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "title"],
      div: ["class", "data-callout", "data-shop-card", "data-article-card", "data-slug"],
      th: ["colspan", "rowspan", "colwidth"],
      td: ["colspan", "rowspan", "colwidth"],
      col: ["style"],
      span: ["class"],
      "*": [],
    },
    allowedClasses: { div: ["callout"], span: ["note"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        const external = /^https?:\/\//.test(attribs.href ?? "");
        return {
          tagName,
          attribs: external ? { ...attribs, target: "_blank", rel: "noopener noreferrer" } : attribs,
        };
      },
    },
  });
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

export type TocItem = { id: string; text: string; level: 2 | 3 };

/** h2/h3 に id を振り、目次を作る */
export function withHeadingIds(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  let n = 0;
  const out = html.replace(/<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/g, (_m, lv: string, _attrs: string | undefined, inner: string) => {
    n += 1;
    const id = `sec-${n}`;
    toc.push({ id, text: stripHtml(inner).trim(), level: Number(lv) as 2 | 3 });
    return `<h${lv} id="${id}">${inner}</h${lv}>`;
  });
  return { html: out, toc };
}

export type BodySegment =
  | { type: "html"; html: string }
  | { type: "shop"; slug: string }
  | { type: "article"; slug: string };

/** 本文を通常HTMLと、店舗紹介カード・関連記事カードの埋め込みに分ける */
export function splitEmbeds(html: string): BodySegment[] {
  const re = /<div[^>]*data-(shop|article)-card[^>]*data-slug="([^"]+)"[^>]*>[\s\S]*?<\/div>|<div[^>]*data-slug="([^"]+)"[^>]*data-(shop|article)-card[^>]*>[\s\S]*?<\/div>/g;
  const segments: BodySegment[] = [];
  let last = 0;
  for (const m of html.matchAll(re)) {
    const kind = (m[1] ?? m[4]) as "shop" | "article";
    const slug = m[2] ?? m[3];
    if (m.index! > last) segments.push({ type: "html", html: html.slice(last, m.index) });
    segments.push({ type: kind, slug });
    last = m.index! + m[0].length;
  }
  if (last < html.length) segments.push({ type: "html", html: html.slice(last) });
  return segments;
}

export function collectEmbedSlugs(html: string, kind: "shop" | "article"): string[] {
  return splitEmbeds(html)
    .filter((s): s is Extract<BodySegment, { slug: string }> => s.type === kind)
    .map((s) => s.slug);
}

/** 日本語の目安として400字=1分で読了時間を出す */
export function readingMinutes(html: string): number {
  return Math.max(1, Math.round(stripHtml(html).replace(/\s/g, "").length / 400));
}

export function slugify(input: string): string {
  const s = input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return s || `post-${Date.now().toString(36)}`;
}
