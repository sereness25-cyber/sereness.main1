import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/site/Section";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "お問い合わせ", alternates: { canonical: "/contact" } };

export default function ContactPage() {
  return (
    <>
      <PageHeader en="Contact" title="お問い合わせ" lead="掲載・取材のご相談、情報提供、記事へのご意見などはこちらから。">
        <Breadcrumbs items={[{ name: "お問い合わせ", href: "/contact" }]} />
      </PageHeader>
      <Container className="max-w-[680px] py-10"><ContactForm /></Container>
    </>
  );
}
