import Link from "next/link";
import { breadcrumbLd } from "@/lib/jsonld";
import { JsonLd } from "./JsonLd";

export function Breadcrumbs({ items }: { items: { name: string; href: string }[] }) {
  const all = [{ name: "ホーム", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="パンくずリスト" className="mb-4 text-xs text-muted">
        <ol className="flex flex-wrap items-center gap-1">
          {all.map((it, i) => (
            <li key={it.href} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true">›</span>}
              {i === all.length - 1 ? (
                <span aria-current="page" className="line-clamp-1">{it.name}</span>
              ) : (
                <Link href={it.href} className="underline-offset-4 hover:underline">{it.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbLd(all)} />
    </>
  );
}
