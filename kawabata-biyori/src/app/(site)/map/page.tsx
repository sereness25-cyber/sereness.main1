import type { Metadata } from "next";
import { MapView } from "@/components/site/MapView";

export const revalidate = 60;
export const metadata: Metadata = { title: "川反マップ", description: "川反のお店を地図で探せます。", alternates: { canonical: "/map" } };

export default async function MapPage() {
  return <MapView />;
}
