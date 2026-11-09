/**
 * SEOアシスタントの採点（仕様書 第11章）。ブラウザでもサーバーでも動く純粋関数。
 * 検索順位を保証するものではなく、記事を見直すための目安です。
 */

export type SeoInput = {
  title: string;
  seoTitle: string;
  seoDescription: string;
  html: string;
  keyword: string;
};

export type SeoCheck = { key: string; label: string; score: number; max: number; messages: string[] };
export type SeoResult = { score: number; rank: "good" | "fair" | "poor"; checks: SeoCheck[] };

const text = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&[a-z#0-9]+;/gi, " ");
const len = (s: string) => [...s.replace(/\s/g, "")].length;

export function scoreSeo(input: SeoInput): SeoResult {
  const kw = input.keyword.trim();
  const title = (input.seoTitle || input.title).trim();
  const desc = input.seoDescription.trim();
  const body = text(input.html);
  const bodyLen = len(body);
  const headings = [...input.html.matchAll(/<h([2-4])[^>]*>([\s\S]*?)<\/h\1>/g)].map((m) => ({ level: Number(m[1]), text: text(m[2]) }));
  const checks: SeoCheck[] = [];

  // SEOタイトル
  {
    const c: SeoCheck = { key: "title", label: "SEOタイトル", score: 0, max: 15, messages: [] };
    const n = len(title);
    if (!n) c.messages.push("タイトルを入力してください。");
    else if (n < 20) { c.score += 6; c.messages.push(`${n}文字です。20〜40文字にすると内容が伝わりやすくなります。`); }
    else if (n > 40) { c.score += 6; c.messages.push(`${n}文字です。検索結果で省略されやすいので40文字以内を目安にしましょう。`); }
    else c.score += 10;
    if (kw && title.includes(kw)) c.score += 5;
    else if (kw) c.messages.push("タイトルにキーワードを入れましょう。");
    else c.score += 2;
    checks.push(c);
  }

  // メタディスクリプション
  {
    const c: SeoCheck = { key: "description", label: "メタディスクリプション", score: 0, max: 15, messages: [] };
    const n = len(desc);
    if (!n) c.messages.push("記事の内容を70〜120文字でまとめましょう。");
    else if (n < 70) { c.score += 6; c.messages.push(`${n}文字です。もう少し詳しく（70〜120文字）書きましょう。`); }
    else if (n > 120) { c.score += 7; c.messages.push(`${n}文字です。120文字を超えると省略されやすくなります。`); }
    else c.score += 10;
    if (kw && desc.includes(kw)) c.score += 5;
    else if (kw && n) c.messages.push("説明文にもキーワードを入れましょう。");
    else if (!kw && n) c.score += 2;
    checks.push(c);
  }

  // 見出し構造
  {
    const c: SeoCheck = { key: "headings", label: "見出し構造", score: 0, max: 15, messages: [] };
    const h2 = headings.filter((h) => h.level === 2).length;
    if (h2 >= 2) c.score += 8;
    else c.messages.push("H2見出しを2つ以上使って、内容を区切りましょう。");
    let ok = true;
    let prev = 1;
    for (const h of headings) {
      if (h.level > prev + 1) ok = false;
      prev = h.level;
    }
    if (headings.length && ok) c.score += 5;
    else if (headings.length) c.messages.push("見出しのレベルが飛んでいます（例: H2の次にH4）。");
    if (headings.every((h) => len(h.text) <= 40)) c.score += 2;
    else c.messages.push("長すぎる見出しがあります。40文字以内にまとめましょう。");
    checks.push(c);
  }

  // キーワード
  {
    const c: SeoCheck = { key: "keyword", label: "キーワード", score: 0, max: 15, messages: [] };
    if (!kw) {
      c.messages.push("フォーカスキーワードを設定すると、より詳しく分析できます。");
    } else {
      const firstPara = text(input.html.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? "");
      if (firstPara.includes(kw)) c.score += 5; else c.messages.push("導入文（最初の段落）にキーワードを入れましょう。");
      if (headings.some((h) => h.text.includes(kw))) c.score += 5; else c.messages.push("見出しのどこかにキーワードを入れましょう。");
      const count = body.split(kw).length - 1;
      const density = bodyLen ? (count * len(kw)) / bodyLen : 0;
      if (count >= 2 && density <= 0.04) c.score += 5;
      else if (count < 2) c.messages.push("本文中でキーワードを自然に2回以上使いましょう。");
      else c.messages.push("キーワードが多すぎます。不自然な繰り返しは避けましょう。");
    }
    checks.push(c);
  }

  // 文章量
  {
    const c: SeoCheck = { key: "length", label: "文章量", score: 0, max: 10, messages: [] };
    if (bodyLen >= 1500) c.score = 10;
    else if (bodyLen >= 800) { c.score = 6; c.messages.push(`本文は約${bodyLen}文字です。1,500文字以上あると内容が充実します。`); }
    else { c.score = bodyLen ? 2 : 0; c.messages.push(`本文は約${bodyLen}文字です。もう少し書き足しましょう。`); }
    checks.push(c);
  }

  // 内部リンク
  {
    const c: SeoCheck = { key: "links", label: "内部リンク", score: 0, max: 10, messages: [] };
    const internal = [...input.html.matchAll(/<a[^>]+href="(\/[^"]*)"/g)].length + [...input.html.matchAll(/data-(shop|article)-card/g)].length;
    if (internal >= 2) c.score = 10;
    else if (internal === 1) { c.score = 5; c.messages.push("関連する記事や店舗へのリンクをもう1つ追加しましょう。"); }
    else c.messages.push("関連する記事や店舗へのリンクを追加しましょう。");
    checks.push(c);
  }

  // 画像alt
  {
    const c: SeoCheck = { key: "alt", label: "画像のalt", score: 0, max: 10, messages: [] };
    const imgs = [...input.html.matchAll(/<img[^>]*>/g)].map((m) => m[0]);
    if (!imgs.length) { c.score = 7; c.messages.push("本文に画像がありません。写真があると読みやすくなります。"); }
    else {
      const missing = imgs.filter((t) => !/alt="[^"]+"/.test(t)).length;
      c.score = missing ? Math.round(10 * (1 - missing / imgs.length)) : 10;
      if (missing) c.messages.push(`${missing}枚の画像に代替テキスト（alt）がありません。`);
    }
    checks.push(c);
  }

  // 読みやすさ
  {
    const c: SeoCheck = { key: "readability", label: "読みやすさ", score: 0, max: 10, messages: [] };
    const sentences = body.split(/[。！？!?\n]/).map((s) => len(s)).filter((n) => n > 0);
    const avg = sentences.length ? sentences.reduce((a, b) => a + b, 0) / sentences.length : 0;
    if (avg && avg <= 50) c.score += 5;
    else if (avg) c.messages.push(`1文の平均が約${Math.round(avg)}文字です。50文字以内を目安に区切ると読みやすくなります。`);
    const paras = [...input.html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => len(text(m[1])));
    const long = paras.filter((n) => n > 200).length;
    if (paras.length && !long) c.score += 5;
    else if (long) c.messages.push(`200文字を超える段落が${long}つあります。改行や箇条書きで区切りましょう。`);
    checks.push(c);
  }

  const score = Math.round(checks.reduce((a, c) => a + c.score, 0));
  return { score, rank: score >= 80 ? "good" : score >= 60 ? "fair" : "poor", checks };
}

export const SEO_RANK_LABEL = { good: "良好", fair: "改善推奨", poor: "要改善" } as const;
