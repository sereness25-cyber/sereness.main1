import Link from "next/link";

export function Pagination({ page, pages, makeHref }: { page: number; pages: number; makeHref: (p: number) => string }) {
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <nav aria-label="ページ送り" className="mt-12 flex justify-center">
      <ul className="flex items-center gap-1.5">
        {page > 1 && (
          <li><Link href={makeHref(page - 1)} className="grid h-11 place-items-center rounded-full bg-white px-4 text-sm shadow-soft">前へ</Link></li>
        )}
        {nums.map((n, i) => (
          <li key={n} className="flex items-center gap-1.5">
            {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
            <Link
              href={makeHref(n)}
              aria-current={n === page ? "page" : undefined}
              className={`grid size-11 place-items-center rounded-full text-sm shadow-soft ${n === page ? "bg-navy text-white" : "bg-white"}`}
            >
              {n}
            </Link>
          </li>
        ))}
        {page < pages && (
          <li><Link href={makeHref(page + 1)} className="grid h-11 place-items-center rounded-full bg-white px-4 text-sm shadow-soft">次へ</Link></li>
        )}
      </ul>
    </nav>
  );
}
