/**
 * 初期記事（src/lib/demo/articles.ts）を supabase/seed.sql に書き出す。
 * 記事はすべて「下書き」で入る。公開は管理画面で事実確認してから行う。
 *   npm run seed:export
 */
import { writeFileSync } from "node:fs";
import { DEMO_ARTICLES } from "../src/lib/demo/articles";

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const lines: string[] = [
  "-- かわばた日和: 初期記事（下書き）",
  "-- このファイルは scripts/export-seed.ts で生成しています。直接編集しないでください。",
  "-- 0001_init.sql の後に SQL Editor で実行します。同じスラッグの記事がある場合は何もしません。",
  "",
];
for (const a of DEMO_ARTICLES) {
  lines.push(
    `insert into public.articles (title, slug, content, excerpt, status, seo_description, focus_keyword, is_featured)`,
    `values (${q(a.title)}, ${q(a.slug)}, ${q(a.content)}, ${q(a.excerpt)}, 'draft', ${q(a.seo_description)}, ${q(a.focus_keyword)}, ${a.is_featured})`,
    `on conflict (slug) do nothing;`,
  );
  for (const c of a.categories) {
    lines.push(
      `insert into public.article_categories (article_id, category_id)`,
      `select a.id, c.id from public.articles a, public.categories c where a.slug = ${q(a.slug)} and c.slug = ${q(c.slug)} on conflict do nothing;`,
    );
  }
  for (const t of a.tags) {
    lines.push(
      `insert into public.tags (name, slug) values (${q(t.name)}, ${q(t.slug)}) on conflict (slug) do nothing;`,
      `insert into public.article_tags (article_id, tag_id)`,
      `select a.id, t.id from public.articles a, public.tags t where a.slug = ${q(a.slug)} and t.slug = ${q(t.slug)} on conflict do nothing;`,
    );
  }
  lines.push("");
}
writeFileSync(new URL("../supabase/seed.sql", import.meta.url), lines.join("\n"));
console.log(`supabase/seed.sql に ${DEMO_ARTICLES.length} 本の下書きを書き出しました`);
