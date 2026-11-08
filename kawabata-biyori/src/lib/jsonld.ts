import { SITE, siteUrl } from "./constants";
import type { Article, EventItem, Shop } from "./types";

/** 構造化データ。ページに表示している内容と一致する項目だけを入れる（仕様書 19-2） */

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    alternateName: SITE.nameEn,
    url: siteUrl(),
    logo: `${siteUrl()}/icon.svg`,
  };
}

export function breadcrumbLd(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${siteUrl()}${it.href}`,
    })),
  };
}

export function articleLd(a: Article) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.seo_title || a.title,
    description: a.seo_description || a.excerpt,
    datePublished: a.published_at ?? undefined,
    dateModified: a.updated_at,
    image: a.thumbnail ? [a.thumbnail] : undefined,
    author: { "@type": "Organization", name: `${SITE.name}編集部` },
    publisher: { "@type": "Organization", name: SITE.name },
    mainEntityOfPage: `${siteUrl()}/articles/${a.slug}`,
  };
}

export function shopLd(s: Shop) {
  // 架空のサンプル店舗には構造化データを出さない
  if (s.is_sample) return null;
  return {
    "@context": "https://schema.org",
    "@type": s.category === "bar" ? "BarOrPub" : "Restaurant",
    name: s.name,
    description: s.description,
    address: s.address ? { "@type": "PostalAddress", streetAddress: s.address, addressLocality: "秋田市", addressRegion: "秋田県", addressCountry: "JP" } : undefined,
    geo: s.lat && s.lng ? { "@type": "GeoCoordinates", latitude: s.lat, longitude: s.lng } : undefined,
    image: s.image ?? undefined,
    url: s.website ?? `${siteUrl()}/shops/${s.slug}`,
    priceRange: s.price_range || undefined,
  };
}

export function eventLd(e: EventItem) {
  if (e.is_sample) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    startDate: e.starts_at,
    endDate: e.ends_at ?? undefined,
    location: e.venue ? { "@type": "Place", name: e.venue, address: e.venue } : undefined,
    organizer: e.organizer ? { "@type": "Organization", name: e.organizer } : undefined,
    image: e.image ?? undefined,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  };
}
