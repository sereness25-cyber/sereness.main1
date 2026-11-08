import type { Category, Tag } from "@/lib/types";

/** 記事一覧の絞り込み（GETフォームなのでJavaScriptなしでも動く） */
export function ArticleFilters({
  categories,
  tags,
  values,
  action = "/articles",
}: {
  categories: Category[];
  tags: Tag[];
  values: { q?: string; category?: string; tag?: string; sort?: string; from?: string; to?: string };
  action?: string;
}) {
  const field = "h-11 w-full rounded-xl border border-beige bg-white px-3 text-sm";
  return (
    <form action={action} method="get" className="grid gap-3 rounded-3xl bg-white p-5 shadow-soft md:grid-cols-6">
      <label className="md:col-span-2">
        <span className="mb-1 block text-xs font-bold text-navy">キーワード</span>
        <input type="search" name="q" defaultValue={values.q} placeholder="例：一人飲み" className={field} />
      </label>
      <label>
        <span className="mb-1 block text-xs font-bold text-navy">カテゴリー</span>
        <select name="category" defaultValue={values.category ?? ""} className={field}>
          <option value="">すべて</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </label>
      <label>
        <span className="mb-1 block text-xs font-bold text-navy">タグ</span>
        <select name="tag" defaultValue={values.tag ?? ""} className={field}>
          <option value="">すべて</option>
          {tags.map((t) => <option key={t.id} value={t.slug}>{t.name}</option>)}
        </select>
      </label>
      <label>
        <span className="mb-1 block text-xs font-bold text-navy">並び順</span>
        <select name="sort" defaultValue={values.sort ?? "new"} className={field}>
          <option value="new">新着順</option>
          <option value="old">古い順</option>
          <option value="recommended">おすすめ順</option>
        </select>
      </label>
      <div className="flex items-end">
        <button type="submit" className="h-11 w-full rounded-full bg-navy text-sm font-bold text-white">絞り込む</button>
      </div>
      <details className="md:col-span-6" open={!!(values.from || values.to)}>
        <summary className="cursor-pointer text-xs text-muted">公開日で絞り込む</summary>
        <div className="mt-2 grid grid-cols-2 gap-3 md:max-w-md">
          <label><span className="mb-1 block text-xs text-muted">から</span><input type="date" name="from" defaultValue={values.from} className={field} /></label>
          <label><span className="mb-1 block text-xs text-muted">まで</span><input type="date" name="to" defaultValue={values.to} className={field} /></label>
        </div>
      </details>
    </form>
  );
}
