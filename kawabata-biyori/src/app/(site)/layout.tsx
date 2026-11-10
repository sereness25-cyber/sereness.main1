import Link from "next/link";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { DemoBanner } from "@/components/site/DemoBanner";
import { BackToTop } from "@/components/site/BackToTop";
import { JsonLd } from "@/components/site/JsonLd";
import { organizationLd } from "@/lib/jsonld";
import { getIssues } from "@/lib/data";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const latest = (await getIssues())[0];
  const issue = latest
    ? { vol: latest.vol, en: `${latest.year} ${new Date(Date.UTC(latest.year, latest.month - 1, 15)).toLocaleString("en-US", { month: "short", timeZone: "UTC" })}.` }
    : null;
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-white">
        本文へ移動
      </a>
      <DemoBanner />
      <Header issue={issue} />
      <main id="main">{children}</main>
      <Footer />
      <div className="kb-fab-space" aria-hidden="true" />
      <Link href="/shops/today" className="kb-fab">🌃 本日営業のお店</Link>
      <BackToTop />
      <JsonLd data={organizationLd()} />
    </>
  );
}
