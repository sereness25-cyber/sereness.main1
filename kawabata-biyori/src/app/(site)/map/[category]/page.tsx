import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SHOP_CATEGORIES, shopCategoryLabel } from "@/lib/constants";
import type { ShopCategory } from "@/lib/types";
import { MapView } from "@/components/site/MapView";

export const revalidate = 60;
type Props = { params: Promise<{ category: string }> };

const isCategory = (c: string): c is ShopCategory => SHOP_CATEGORIES.some((x) => x.value === c);

export function generateStaticParams() {
  return SHOP_CATEGORIES.map((c) => ({ category: c.value }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!isCategory(category)) return {};
  const label = shopCategoryLabel(category);
  return { title: `川反マップ（${label}）`, description: `川反の${label}を地図で探せます。`, alternates: { canonical: `/map/${category}` } };
}

export default async function MapCategoryPage({ params }: Props) {
  const { category } = await params;
  if (!isCategory(category)) notFound();
  return <MapView active={category} />;
}
