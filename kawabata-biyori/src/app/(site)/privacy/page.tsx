import type { Metadata } from "next";
import { SITE } from "@/lib/constants";
import { Container, PageHeader } from "@/components/site/Section";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export const metadata: Metadata = { title: "プライバシーポリシー", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader en="Privacy policy" title="プライバシーポリシー">
        <Breadcrumbs items={[{ name: "プライバシーポリシー", href: "/privacy" }]} />
      </PageHeader>
      <Container className="max-w-[760px] py-10">
        <div className="article-body">
          <p>{SITE.operator}（以下「当運営者」）は、{SITE.name}（以下「本サイト」）における個人情報の取り扱いについて、次のとおり定めます。</p>
          <h2>1. 取得する情報</h2>
          <p>お問い合わせフォームから送信されたお名前、メールアドレス、お問い合わせ内容を取得します。</p>
          <h2>2. 利用目的</h2>
          <ul>
            <li>お問い合わせへの回答・ご連絡のため</li>
            <li>掲載・取材に関するご相談への対応のため</li>
          </ul>
          <h2>3. 第三者への提供</h2>
          <p>法令に基づく場合を除き、ご本人の同意なく個人情報を第三者に提供しません。</p>
          <h2>4. 外部サービスの利用</h2>
          <p>本サイトは、データの保存にSupabase、地図の表示にOpenStreetMapを利用しています。地図を表示する際、地図タイルの配信元へ閲覧者のIPアドレス等が送信されます。</p>
          <p>アクセス解析ツールを導入する場合は、その名称と取得する情報を本ポリシーに追記します。</p>
          <h2>5. 開示・訂正・削除</h2>
          <p>ご本人からの個人情報の開示・訂正・削除のご依頼には、本人確認のうえ対応します。お問い合わせフォームからご連絡ください。</p>
          <h2>6. 改定</h2>
          <p>本ポリシーは必要に応じて改定することがあります。改定後の内容は本ページに掲載した時点から効力を生じます。</p>
          <p className="text-sm text-muted">制定日：【要記入】</p>
        </div>
      </Container>
    </>
  );
}
