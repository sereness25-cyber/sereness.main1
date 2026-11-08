import Link from "next/link";
import { Container } from "@/components/site/Section";

export default function NotFound() {
  return (
    <Container className="max-w-[640px] py-24 text-center">
      <p className="font-en text-5xl italic text-rose-deep">404</p>
      <h1 className="mt-3 text-2xl text-navy">ページが見つかりませんでした</h1>
      <p className="mt-3 text-muted">お探しのページは移動したか、削除された可能性があります。</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="rounded-full bg-navy px-6 py-3 font-bold text-white">トップへ</Link>
        <Link href="/search" className="rounded-full bg-white px-6 py-3 font-bold text-navy shadow-soft">検索する</Link>
      </div>
    </Container>
  );
}
