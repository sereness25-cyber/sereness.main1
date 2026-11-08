import { z } from "zod/v4";

export const briefSchema = z.object({
  theme: z.string().trim().min(2, "テーマを入力してください。").max(300),
  category: z.string().trim().max(40).default(""),
  target: z.string().trim().max(200).default(""),
  tone: z.string().trim().max(60).default("親しみやすい"),
  length: z.number().int().min(1000).max(5000).default(2000),
  keyword: z.string().trim().max(60).default(""),
  notes: z.string().trim().max(8000).default(""),
  imageStyle: z.enum(["photo", "kawaii", "watercolor", "magazine", "auto"]).default("auto"),
});
export type Brief = z.infer<typeof briefSchema>;

export const outlineSchema = z.object({
  titles: z.array(z.string()).describe("記事タイトル案を3つ。32文字前後"),
  slug: z.string().describe("URLスラッグ案。半角英小文字とハイフンのみ"),
  intro: z.string().describe("導入文。150〜250文字"),
  sections: z
    .array(z.object({ h2: z.string(), h3: z.array(z.string()), memo: z.string().describe("この章で書く内容のメモ") }))
    .describe("見出し構成。H2を4〜7個"),
});
export type Outline = z.infer<typeof outlineSchema>;

export const bodySchema = z.object({
  intro: z.string().describe("導入文。プレーンテキスト"),
  body_html: z.string().describe("本文のHTML。h2,h3,p,ul,ol,li,strong,blockquote,table のみ使用。導入文とまとめは含めない"),
  summary_html: z.string().describe("まとめの章のHTML。<h2>まとめ</h2> から始める"),
  excerpt: z.string().describe("記事一覧に出す概要。80〜120文字"),
  fact_check: z.array(z.string()).describe("公開前に編集者が確認すべき事実（店名、日付、数字、伝承など）"),
});

export const seoSchema = z.object({
  seo_title: z.string().describe("検索結果用タイトル。32文字前後、キーワードを前半に"),
  seo_description: z.string().describe("メタディスクリプション。80〜120文字"),
  related_slugs: z.array(z.string()).describe("候補リストから選んだ関連記事のスラッグ。最大3件。候補にないものは書かない"),
  instagram: z.string().describe("Instagram投稿文。改行と絵文字を少し使い、ハッシュタグを5〜8個"),
  x: z.string().describe("X投稿文。120文字以内、ハッシュタグ2個まで"),
  suggestions: z
    .array(z.object({ area: z.enum(["title", "headings", "intro", "internal_links", "meta"]), advice: z.string() }))
    .describe("改善提案。具体的に"),
});

export const REWRITE_MODES = {
  friendly: "もっと親しみやすい言い回しにする",
  polite: "丁寧で落ち着いた言い回しにする",
  shorter: "意味を保ったまま短くする",
  longer: "具体例や説明を足して詳しくする（事実を新しく作らない）",
  readable: "1文を短くし、読みやすく整える",
  seo: "キーワードを自然に含め、検索で伝わりやすくする",
  typo: "誤字脱字と表記ゆれだけを直す（内容は変えない）",
} as const;
export type RewriteMode = keyof typeof REWRITE_MODES;

export const rewriteSchema = z.object({ text: z.string().describe("書き換え後の文章。入力がHTMLならHTMLのまま返す") });
