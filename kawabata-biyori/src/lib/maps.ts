/**
 * Googleマップ（APIキー不要）のURLを作る。
 * 「店名 + 住所」で探すので、Googleマップにお店の登録があれば、そのお店のページ（名前・口コミ・営業時間など）が出る。
 * 住所がないときだけ緯度・経度を使う。
 */
type MapShop = { name: string; address: string; lat: number | null; lng: number | null; google_maps_url?: string | null };

export function mapsQuery(s: MapShop): string {
  if (s.address) return `${s.name} ${s.address}`;
  if (s.lat !== null && s.lng !== null) return `${s.lat},${s.lng}`;
  return "";
}

export const mapsEmbedUrl = (q: string, zoom = 17) => `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=${zoom}&output=embed`;

/** 「Googleマップで開く」。管理ページでお店のGoogleマップのURLが登録されていれば、それを優先する */
export function mapsOpenUrl(s: MapShop): string {
  if (s.google_maps_url && /^https:\/\//.test(s.google_maps_url)) return s.google_maps_url;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery(s))}`;
}

export const mapsDirectionsUrl = (s: MapShop) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery(s))}`;
