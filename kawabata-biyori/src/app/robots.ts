import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/constants";

// 管理画面は検索対象から外す。保護そのものは認証で行う（robots.txt は保護ではない）
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
