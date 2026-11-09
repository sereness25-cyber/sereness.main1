import type { Category } from "@/lib/types";

// supabase/migrations/0001_init.sql の初期カテゴリーと同じ内容
export const DEMO_CATEGORIES: Category[] = [
  { id: "cat-beginner", name: "はじめての川反", slug: "beginner", description: "川反デビューの前に知っておきたいことを、やさしくまとめています。", image: null, sort_order: 1 },
  { id: "cat-gourmet", name: "川反グルメ", slug: "gourmet", description: "居酒屋からBARまで、川反で味わえる一皿と一杯。", image: null, sort_order: 2 },
  { id: "cat-people", name: "川反の人々", slug: "people", description: "川反で働く人、暮らす人、通う人のストーリー。", image: null, sort_order: 3 },
  { id: "cat-history", name: "川反の歴史", slug: "history", description: "花街として栄えた時代から今へ。川反の歩みをたどります。", image: null, sort_order: 4 },
  { id: "cat-enjoy", name: "川反の楽しみ方", slug: "enjoy", description: "一人飲み、二次会、お酒を飲まない夜。川反の楽しみ方いろいろ。", image: null, sort_order: 5 },
  { id: "cat-news", name: "川反ニュース", slug: "news", description: "新店情報、イベント、街の話題をお届けします。", image: null, sort_order: 6 },
  { id: "cat-future", name: "川反の未来", slug: "future", description: "これからの川反を、みんなで考える場所。", image: null, sort_order: 7 },
];

export const demoCategory = (slug: string) => {
  const c = DEMO_CATEGORIES.find((x) => x.slug === slug);
  if (!c) throw new Error(`unknown category ${slug}`);
  return c;
};
