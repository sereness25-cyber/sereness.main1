"use client";

import dynamic from "next/dynamic";
import type { MapShop } from "./ShopMap";

const ShopMap = dynamic(() => import("./ShopMap"), {
  ssr: false,
  loading: () => <div className="grid h-80 w-full place-items-center rounded-3xl bg-beige text-sm text-muted">地図を読み込んでいます…</div>,
});

export function MapClient(props: { shops: MapShop[]; height?: number }) {
  return <ShopMap {...props} />;
}
