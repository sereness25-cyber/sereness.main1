import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { Container, PageHeader } from "@/components/site/Section";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export const metadata: Metadata = { title: "メディアについて", description: `${SITE.name}について。`, alternates: { canonical: "/about" } };

export default function AboutPage() {
  return (
    <>
      <PageHeader en="About" title="かわばた日和について">
        <Breadcrumbs items={[{ name: "メディアについて", href: "/about" }]} />
      </PageHeader>
      <Container className="max-w-[760px] py-10">
        <div className="article-body">
          <p className="font-maru text-xl font-bold text-navy">{SITE.catch}</p>
          <p>「かわばた日和」は、秋田市の繁華街・川反の魅力を発信する地域Webマガジンです。お店、歴史、人、イベント、楽しみ方。川反のいろいろな表情を、記事を通してお届けします。</p>
          <h2>大切にしていること</h2>
          <ul>
            <li><strong>確かな情報を届けます。</strong>店舗情報は確認した日付とあわせて掲載し、不確かな情報は載せません。</li>
            <li><strong>川反全体を紹介します。</strong>特定のお店に偏らず、街全体のにぎわいにつながる発信をします。</li>
            <li><strong>広告を明示します。</strong>広告記事・タイアップ記事には「PR」と表示します。</li>
            <li><strong>AIの使い方を明らかにします。</strong>記事や画像の制作にAIを使うことがありますが、必ず編集部が内容を確認してから公開します。AIで作った画像には「イメージ画像」と表示し、実在するお店や人物の写真としては扱いません。</li>
          </ul>
          <h2>掲載・取材について</h2>
          <p>お店の掲載や取材のご相談、情報提供は<Link href="/contact">お問い合わせ</Link>からお寄せください。掲載にあたっては、内容と写真の使用についてお店に確認を取っています。</p>
          <h2>運営</h2>
          <p>{SITE.name}は {SITE.operator} が運営しています。運営の詳細は<Link href="/company">運営者情報</Link>をご覧ください。</p>
        </div>
      </Container>
    </>
  );
}
