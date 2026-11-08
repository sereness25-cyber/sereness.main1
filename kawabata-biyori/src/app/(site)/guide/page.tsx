import type { Metadata } from "next";
import Link from "next/link";
import { getArticlesByCategory, queryShops } from "@/lib/data";
import { ArticleRow, ShopCard } from "@/components/site/Cards";
import { Container, PageHeader } from "@/components/site/Section";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { BeginnerMark } from "@/components/site/Badges";
import { SHOP_CATEGORIES } from "@/lib/constants";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "はじめての川反ガイド",
  description: "川反ってどんな街？お店の種類、料金のしくみ、お店の探し方まで。はじめての川反を5つのステップで案内します。",
  alternates: { canonical: "/guide" },
};

export default async function GuidePage() {
  const [articles, shops] = await Promise.all([getArticlesByCategory("beginner", 6), queryShops({ beginner: true })]);
  const find = (slug: string) => articles.find((a) => a.slug === slug);

  const steps = [
    {
      id: "step1",
      title: "川反ってどんな街？",
      body: (
        <>
          <p>川反（かわばた）は、秋田市大町の旭川沿いに広がる繁華街の通称です。川沿いの川反通りを中心に、居酒屋、BAR、スナックなどさまざまなお店が集まっています。</p>
          <p>明治時代には花街として栄え、芸者衆が行き交った歴史もある街です。</p>
        </>
      ),
      links: ["what-is-kawabata", "kawabata-history"],
    },
    {
      id: "step2",
      title: "お店の種類を知ろう",
      body: (
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            ["居酒屋", "食事とお酒をしっかり。グループにも。"],
            ["BAR", "カウンターで一杯をゆっくり。一人でも。"],
            ["スナック", "ママとの会話やカラオケを楽しむ。"],
            ["ダイニング", "食事が主役。落ち着いた空間で。"],
          ].map(([k, v]) => (
            <li key={k} className="rounded-2xl bg-ivory p-4"><strong className="font-maru text-navy">{k}</strong><br /><span className="text-sm">{v}</span></li>
          ))}
        </ul>
      ),
      links: ["bar-and-snack"],
    },
    {
      id: "step3",
      title: "料金システムを知ろう",
      body: (
        <>
          <p>お店によって料金のしくみは違います。よくあるのは次の3つです。</p>
          <ul className="list-disc pl-5">
            <li><strong>注文した分だけ</strong>：居酒屋など。メニューの金額の合計。</li>
            <li><strong>チャージ（席料）＋注文分</strong>：BARなど。お通しが付くお店も。</li>
            <li><strong>セット料金</strong>：スナックなど。一定時間の飲み放題などがセットに。</li>
          </ul>
          <p>わからないときは、注文前に「料金のしくみを教えてください」と聞いて大丈夫です。</p>
        </>
      ),
      links: ["choosing-a-shop"],
    },
    {
      id: "step4",
      title: "自分に合ったお店を探そう",
      body: (
        <>
          <p>はじめてなら、<BeginnerMark />マークのお店がおすすめ。料金が明確で、はじめてのお客さまを歓迎しているお店です。</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/shops?beginner=1" className="rounded-full bg-navy px-4 py-2 text-sm text-white">初心者歓迎のお店</Link>
            <Link href="/shops?solo=1" className="rounded-full bg-white px-4 py-2 text-sm text-navy shadow-soft">一人で入りやすいお店</Link>
            <Link href="/shops?nonalc=1" className="rounded-full bg-white px-4 py-2 text-sm text-navy shadow-soft">ノンアル対応のお店</Link>
            {SHOP_CATEGORIES.slice(0, 3).map((c) => (
              <Link key={c.value} href={`/shops?category=${c.value}`} className="rounded-full bg-white px-4 py-2 text-sm text-navy shadow-soft">{c.label}</Link>
            ))}
          </div>
        </>
      ),
      links: ["solo-drinking", "without-alcohol"],
    },
    {
      id: "step5",
      title: "川反を楽しもう",
      body: (
        <>
          <p>早めの時間に1軒目へ。気に入ったら、お店の人に次のおすすめを聞いてみるのも楽しみ方のひとつです。お酒を飲んだら運転はせず、帰り道まで気持ちよく。</p>
        </>
      ),
      links: ["nijikai"],
    },
  ];

  return (
    <>
      <PageHeader en="First time guide" title="はじめての川反ガイド" lead="知っておくと安心。5つのステップで、はじめての川反をご案内します。">
        <Breadcrumbs items={[{ name: "はじめての川反", href: "/guide" }]} />
      </PageHeader>
      <Container className="max-w-[860px] py-10">
        <nav aria-label="ステップ" className="mb-10 grid grid-cols-5 gap-1.5 text-center">
          {steps.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} className="rounded-2xl bg-white px-1 py-3 shadow-soft">
              <span className="block font-en text-xs italic text-rose-deep">STEP</span>
              <span className="font-en text-xl font-semibold text-navy">{i + 1}</span>
            </a>
          ))}
        </nav>
        <ol className="space-y-8">
          {steps.map((s, i) => (
            <li key={s.id} id={s.id} className="scroll-mt-24 rounded-3xl bg-white p-6 shadow-soft md:p-8">
              <p className="font-en text-sm italic tracking-widest text-rose-deep">STEP {i + 1}</p>
              <h2 className="mt-1 text-xl text-navy md:text-2xl">{s.title}</h2>
              <div className="mt-4 space-y-3 leading-8">{s.body}</div>
              {s.links.map(find).filter(Boolean).length > 0 && (
                <div className="mt-5 grid gap-3">
                  {s.links.map(find).filter((a) => !!a).map((a) => <ArticleRow key={a!.id} article={a!} />)}
                </div>
              )}
            </li>
          ))}
        </ol>

        {shops.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-5 text-xl text-navy">初心者歓迎のお店</h2>
            <div className="grid gap-6 sm:grid-cols-2">{shops.slice(0, 4).map((s) => <ShopCard key={s.id} shop={s} />)}</div>
          </section>
        )}
      </Container>
    </>
  );
}
