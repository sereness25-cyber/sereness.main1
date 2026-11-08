import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { DemoBanner } from "@/components/site/DemoBanner";
import { BackToTop } from "@/components/site/BackToTop";
import { JsonLd } from "@/components/site/JsonLd";
import { organizationLd } from "@/lib/jsonld";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-white">
        本文へ移動
      </a>
      <DemoBanner />
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <BackToTop />
      <JsonLd data={organizationLd()} />
    </>
  );
}
