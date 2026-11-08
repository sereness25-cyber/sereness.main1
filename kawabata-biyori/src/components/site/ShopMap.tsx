"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { KAWABATA_CENTER } from "@/lib/constants";

export type MapShop = {
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  lat: number;
  lng: number;
  isSample?: boolean;
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** OpenStreetMap + Leaflet で店舗の位置を表示する（APIキー不要） */
export default function ShopMap({ shops, height = 480 }: { shops: MapShop[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let map: import("leaflet").Map | undefined;
    (async () => {
      const L = await import("leaflet");
      if (disposed || !ref.current) return;
      map = L.map(ref.current, { scrollWheelZoom: false }).setView(KAWABATA_CENTER, 16);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      const icon = L.divIcon({
        className: "",
        html: '<span style="display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#d9a7ad;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 22],
        popupAnchor: [0, -20],
      });
      const bounds: [number, number][] = [];
      for (const s of shops) {
        const dir = `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`;
        L.marker([s.lat, s.lng], { icon, title: s.name })
          .addTo(map)
          .bindPopup(
            `<strong>${esc(s.name)}</strong><br><small>${esc(s.categoryLabel)}${s.isSample ? "（架空のサンプル）" : ""}</small><br>` +
              `<a href="/shops/${encodeURIComponent(s.slug)}">詳しく見る</a>${s.isSample ? "" : ` ／ <a href="${dir}" target="_blank" rel="noopener">経路</a>`}`,
          );
        bounds.push([s.lat, s.lng]);
      }
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
    })();
    return () => {
      disposed = true;
      map?.remove();
    };
  }, [shops]);

  return <div ref={ref} style={{ height }} className="w-full overflow-hidden rounded-3xl bg-beige shadow-soft" role="region" aria-label="川反マップ" />;
}
