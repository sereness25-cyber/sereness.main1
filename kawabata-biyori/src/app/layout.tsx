import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Noto_Sans_JP, Zen_Maru_Gothic } from "next/font/google";
import { SITE, siteUrl } from "@/lib/constants";
import "./globals.css";

const zenMaru = Zen_Maru_Gothic({ weight: ["500", "700"], subsets: ["latin"], variable: "--font-zen-maru", display: "swap", preload: false });
const notoSans = Noto_Sans_JP({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-noto-sans", display: "swap", preload: false });
const cormorant = Cormorant_Garamond({ weight: ["500", "600"], style: ["normal", "italic"], subsets: ["latin"], variable: "--font-cormorant", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE.name}｜${SITE.catch}`, template: `%s｜${SITE.name}` },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: SITE.name,
    title: `${SITE.name}｜${SITE.catch}`,
    description: SITE.description,
    images: [{ url: "/ogp.png", width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#faf8f5", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${zenMaru.variable} ${notoSans.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  );
}
