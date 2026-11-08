-- かわばた日和: 初期スキーマ
-- Supabase の SQL Editor で実行するか、`supabase db push` で適用します。

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- 管理者
-- ---------------------------------------------------------------
create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '編集部',
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

-- RLS の判定に使う。security definer で admin_profiles 自体の RLS を回避する
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_profiles where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------
-- カテゴリー・タグ
-- ---------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  image text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- 記事
-- ---------------------------------------------------------------
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  slug text not null unique,
  content text not null default '',
  excerpt text not null default '',
  thumbnail text,
  thumbnail_alt text not null default '',
  thumbnail_is_ai boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'scheduled', 'private')),
  published_at timestamptz,
  seo_title text not null default '',
  seo_description text not null default '',
  focus_keyword text not null default '',
  is_featured boolean not null default false,
  is_sponsored boolean not null default false,
  author_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists articles_status_published_at on public.articles (status, published_at desc);

create table if not exists public.article_categories (
  article_id uuid not null references public.articles (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (article_id, category_id)
);

create table if not exists public.article_tags (
  article_id uuid not null references public.articles (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (article_id, tag_id)
);

-- ---------------------------------------------------------------
-- 店舗
-- ---------------------------------------------------------------
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null check (category in ('izakaya', 'bar', 'snack', 'dining', 'karaoke', 'other')),
  description text not null default '',
  address text not null default '',
  lat double precision,
  lng double precision,
  business_hours text not null default '',
  closed_days text not null default '',
  price_range text not null default '',
  budget_level int check (budget_level between 1 and 4),
  payment_methods text not null default '',
  seats text not null default '',
  solo_ok boolean,
  non_alcohol boolean,
  beginner_welcome boolean not null default false,
  sns jsonb not null default '{}'::jsonb,
  website text,
  image text,
  image_alt text not null default '',
  photo_permission boolean not null default false,
  verified_at date,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.article_shops (
  article_id uuid not null references public.articles (id) on delete cascade,
  shop_id uuid not null references public.shops (id) on delete cascade,
  primary key (article_id, shop_id)
);

-- ---------------------------------------------------------------
-- イベント
-- ---------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue text not null default '',
  fee text not null default '',
  content text not null default '',
  organizer text not null default '',
  how_to_apply text not null default '',
  image text,
  image_alt text not null default '',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- メディアライブラリ
-- ---------------------------------------------------------------
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  url text not null,
  alt text not null default '',
  mime text not null,
  width int,
  height int,
  bytes int,
  source text not null default 'upload' check (source in ('upload', 'ai')),
  prompt text,
  style text,
  parent_id uuid references public.media (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- AI利用履歴・設定・お問い合わせ
-- ---------------------------------------------------------------
create table if not exists public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  kind text not null,
  status text not null default 'running' check (status in ('running', 'succeeded', 'failed')),
  model text,
  input_tokens int,
  output_tokens int,
  error text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists ai_logs_user_created on public.ai_generation_logs (user_id, created_at desc);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 200),
  subject text not null default '' check (char_length(subject) <= 200),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- updated_at の自動更新
-- ---------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists articles_touch on public.articles;
create trigger articles_touch before update on public.articles
  for each row execute function public.touch_updated_at();
drop trigger if exists shops_touch on public.shops;
create trigger shops_touch before update on public.shops
  for each row execute function public.touch_updated_at();
drop trigger if exists events_touch on public.events;
create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------
-- Row Level Security
-- 公開データは誰でも読めるが、書き込みは管理者だけ
-- ---------------------------------------------------------------
alter table public.admin_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.articles enable row level security;
alter table public.article_categories enable row level security;
alter table public.article_tags enable row level security;
alter table public.shops enable row level security;
alter table public.article_shops enable row level security;
alter table public.events enable row level security;
alter table public.media enable row level security;
alter table public.ai_generation_logs enable row level security;
alter table public.site_settings enable row level security;
alter table public.contact_messages enable row level security;

-- 管理者: 自分の行だけ読める（追加は SQL Editor から行う）
create policy admin_profiles_self on public.admin_profiles
  for select using (user_id = auth.uid());

-- 記事: 公開済み、または予約時刻を過ぎた予約記事だけを公開する
create policy articles_public_read on public.articles
  for select using (
    status in ('published', 'scheduled') and published_at is not null and published_at <= now()
  );
create policy articles_admin_all on public.articles
  for all using (public.is_admin()) with check (public.is_admin());

create policy categories_public_read on public.categories for select using (true);
create policy categories_admin_all on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy tags_public_read on public.tags for select using (true);
create policy tags_admin_all on public.tags
  for all using (public.is_admin()) with check (public.is_admin());

create policy article_categories_public_read on public.article_categories for select using (true);
create policy article_categories_admin_all on public.article_categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy article_tags_public_read on public.article_tags for select using (true);
create policy article_tags_admin_all on public.article_tags
  for all using (public.is_admin()) with check (public.is_admin());

create policy article_shops_public_read on public.article_shops for select using (true);
create policy article_shops_admin_all on public.article_shops
  for all using (public.is_admin()) with check (public.is_admin());

create policy shops_public_read on public.shops for select using (is_published);
create policy shops_admin_all on public.shops
  for all using (public.is_admin()) with check (public.is_admin());

create policy events_public_read on public.events for select using (is_published);
create policy events_admin_all on public.events
  for all using (public.is_admin()) with check (public.is_admin());

create policy media_public_read on public.media for select using (true);
create policy media_admin_all on public.media
  for all using (public.is_admin()) with check (public.is_admin());

create policy ai_logs_admin_all on public.ai_generation_logs
  for all using (public.is_admin()) with check (public.is_admin());

-- サイト設定は公開用キーだけ誰でも読める（AI設定は管理者のみ）
create policy site_settings_public_read on public.site_settings
  for select using (key = 'site');
create policy site_settings_admin_all on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- お問い合わせ: 誰でも送信でき、読めるのは管理者だけ
create policy contact_insert on public.contact_messages for insert with check (true);
create policy contact_admin_read on public.contact_messages for select using (public.is_admin());
create policy contact_admin_delete on public.contact_messages for delete using (public.is_admin());

-- ---------------------------------------------------------------
-- Storage: 画像用の公開バケット
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy media_bucket_public_read on storage.objects
  for select using (bucket_id = 'media');
create policy media_bucket_admin_insert on storage.objects
  for insert with check (bucket_id = 'media' and public.is_admin());
create policy media_bucket_admin_update on storage.objects
  for update using (bucket_id = 'media' and public.is_admin());
create policy media_bucket_admin_delete on storage.objects
  for delete using (bucket_id = 'media' and public.is_admin());

-- ---------------------------------------------------------------
-- 初期カテゴリー（仕様書 第5章）
-- ---------------------------------------------------------------
insert into public.categories (name, slug, description, sort_order) values
  ('はじめての川反', 'beginner', '川反デビューの前に知っておきたいことを、やさしくまとめています。', 1),
  ('川反グルメ', 'gourmet', '居酒屋からBARまで、川反で味わえる一皿と一杯。', 2),
  ('川反の人々', 'people', '川反で働く人、暮らす人、通う人のストーリー。', 3),
  ('川反の歴史', 'history', '花街として栄えた時代から今へ。川反の歩みをたどります。', 4),
  ('川反の楽しみ方', 'enjoy', '一人飲み、二次会、お酒を飲まない夜。川反の楽しみ方いろいろ。', 5),
  ('川反ニュース', 'news', '新店情報、イベント、街の話題をお届けします。', 6),
  ('川反の未来', 'future', 'これからの川反を、みんなで考える場所。', 7)
on conflict (slug) do nothing;

insert into public.site_settings (key, value) values
  ('site', '{"instagram": "", "x": "", "facebook": "", "youtube": ""}'::jsonb),
  ('ai', '{"text_model": "claude-opus-5-5", "effort": "medium", "image_model": "gpt-image-2", "daily_limit": 50}'::jsonb)
on conflict (key) do nothing;
