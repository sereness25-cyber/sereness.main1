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

export type ShopPhoto = { url: string; caption: string };

/** 1つの営業時間帯。閉店が開店と同じか早ければ翌日に閉店（例 19:00〜03:00） */
export type HoursRange = { open: string; close: string };
/** 曜日ごとの営業時間。closed_nth は「第1・第3月曜は休み」のような指定 */
export type DayHours = { closed: boolean; ranges: HoursRange[]; closed_nth?: number[] };
/** 臨時休業・臨時営業・時間変更（date はその営業日） */
export type SpecialHours = { date: string; closed: boolean; ranges?: HoursRange[]; note?: string };

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
  /** メイン以外の写真（お店のページに並べる） */
  gallery?: ShopPhoto[];
  /** 曜日別の営業時間（"0"＝日曜〜"6"＝土曜）。未登録なら null で、営業中の自動判定はしない */
  hours?: Record<string, DayHours> | null;
  /** 臨時休業・臨時営業など */
  specials?: SpecialHours[];
  /** 設備・サービス（karaoke, darts など） */
  features?: string[];
  photo_permission: boolean;
  verified_at: string | null;
  is_published: boolean;
  updated_at: string;
  /** 情報の出典 */
  sources: { label: string; url: string }[];
  /** お店本人に掲載内容を確認済みか。false なら「公開情報をもとに掲載」と表示する */
  shop_confirmed: boolean;
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
  /** 管理画面で差し替えたイメージ写真（キーは lib/photos.ts の PHOTOS） */
  photos?: Record<string, { url: string; alt: string }>;
};

export type AiSettings = {
  text_model: string;
  effort: "low" | "medium" | "high";
  image_model: string;
  daily_limit: number;
};
