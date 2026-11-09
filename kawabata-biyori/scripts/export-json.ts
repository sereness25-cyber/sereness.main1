/**
 * いまの初期データ（記事の下書き・調べたお店・カテゴリー）を、
 * GitHub 版の管理ページが編集する kawabata-data/*.json に書き出す。最初の1回だけ使う。
 *   npx tsx scripts/export-json.ts ../kawabata-data
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEMO_ARTICLES } from "../src/lib/demo/articles";
import { DEMO_CATEGORIES } from "../src/lib/demo/categories";
import { RESEARCHED_SHOPS } from "../src/lib/content/shops";

const dir = path.resolve(process.argv[2] ?? "../kawabata-data");
if (existsSync(path.join(dir, "articles.json"))) {
  console.error(`${dir}/articles.json はすでにあります。上書きしないよう中止しました。`);
  process.exit(1);
}
mkdirSync(dir, { recursive: true });
const write = (f: string, v: unknown) => writeFileSync(path.join(dir, f), JSON.stringify(v, null, 2) + "\n");

write("categories.json", { categories: DEMO_CATEGORIES });
write("articles.json", {
  articles: DEMO_ARTICLES.map(({ categories, shop_ids, is_sample, ...a }) => ({
    ...a,
    category_slugs: categories.map((c) => c.slug),
    shop_slugs: [] as string[],
  })),
});
write("shops.json", { shops: RESEARCHED_SHOPS });
write("events.json", { events: [] });
write("settings.json", { instagram: "", x: "", facebook: "", youtube: "" });
console.log(`${dir} に書き出しました`);
