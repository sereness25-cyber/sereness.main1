export type ArticleStatus = "draft" | "published" | "scheduled" | "private";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  sort_order: number;
};

export type Tag = { id: string; name: string; slug: string };

export type Article = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  thumbnail: string | null;
  thumbnail_alt: string;
  thumbnail_is_ai: boolean;
  status: ArticleStatus;
  published_at: string | null;
  updated_at: string;
  created_at: string;
  seo_title: string;
  seo_description: string;
  focus_keyword: string;
  is_featured: boolean;
  is_sponsored: boolean;
  categories: Category[];
  tags: Tag[];
  shop_ids: string[];
  /** デモ表示用の下書き。本番データでは常に false */
  is_sample?: boolean;
};

export type ShopCategory = "izakaya" | "bar" | "snack" | "dining" | "karaoke" | "other";

export type Shop = {
  id: string;
  name: string;
  slug: string;
  category: ShopCategory;
  description: string;
  address: string;
  lat: number | null;
  lng: number | null;
  business_hours: string;
  closed_days: string;
  price_range: string;
  budget_level: number | null;
  payment_methods: string;
  seats: string;
  solo_ok: boolean | null;
  non_alcohol: boolean | null;
  beginner_welcome: boolean;
  sns: { instagram?: string; x?: string; facebook?: string; youtube?: string };
  website: string | null;
  image: string | null;
  image_alt: string;
  photo_permission: boolean;
  verified_at: string | null;
  is_published: boolean;
  updated_at: string;
  /** 架空のサンプル店舗。本番データでは常に false */
  is_sample?: boolean;
};

export type EventItem = {
  id: string;
  title: string;
  slug: string;
  starts_at: string;
  ends_at: string | null;
  venue: string;
  fee: string;
  content: string;
  organizer: string;
  how_to_apply: string;
  image: string | null;
  image_alt: string;
  is_published: boolean;
  updated_at: string;
  is_sample?: boolean;
};

export type Media = {
  id: string;
  path: string;
  url: string;
  alt: string;
  mime: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  source: "upload" | "ai";
  prompt: string | null;
  style: string | null;
  parent_id: string | null;
  created_at: string;
};

export type SiteSettings = {
  instagram: string;
  x: string;
  facebook: string;
  youtube: string;
};

export type AiSettings = {
  text_model: string;
  effort: "low" | "medium" | "high";
  image_model: string;
  daily_limit: number;
};
