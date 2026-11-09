-- かわばた日和: データベースの一括セットアップ
-- Supabase の SQL Editor に全部貼り付けて「Run」を押してください。
-- このファイルは scripts/build-setup-sql.mjs で生成しています。

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

-- 店舗情報の出典と、お店本人に確認済みかどうか
alter table public.shops add column if not exists sources jsonb not null default '[]'::jsonb;
alter table public.shops add column if not exists shop_confirmed boolean not null default false;
comment on column public.shops.sources is '情報の出典 [{"label": "...", "url": "https://..."}]';
comment on column public.shops.shop_confirmed is 'お店本人に掲載内容を確認済みなら true。false のときは「公開情報をもとに掲載」と表示する';
comment on column public.shops.verified_at is '情報の確認日（shop_confirmed=false のときは公開情報を調べた日）';

-- かわばた日和: 初期記事（下書き）
-- このファイルは scripts/export-seed.ts で生成しています。直接編集しないでください。
-- 0001_init.sql の後に SQL Editor で実行します。同じスラッグの記事がある場合は何もしません。

insert into public.articles (title, slug, content, excerpt, status, seo_description, focus_keyword, is_featured)
values ('川反ってどんな街？はじめての人のための川反ガイド', 'what-is-kawabata', '<p>「川反（かわばた）」は、秋田市の繁華街の通称です。居酒屋、BAR、スナック、ダイニングなど、さまざまなお店が集まっています。「名前は聞いたことがあるけれど、行ったことはない」という人も多いのではないでしょうか。この記事では、はじめての人に向けて川反の基本をまとめました。</p>
<h2>川反はどこにある？</h2>
<p>川反は、秋田市<strong>大町</strong>の<strong>旭川沿い</strong>に広がるエリアです。通りは南北に長く、川に沿ってお店が続いています。「川反」は通称で、現在の住所表記は「大町」です。</p>
<h3>中心になる3つの通り</h3>
<ul>
<li><strong>川反通り</strong>：旭川沿いの、川反のメインストリート</li>
<li><strong>横町通り</strong>：五丁目橋を渡った先の通り</li>
<li><strong>赤れんが館通り</strong></li>
</ul>
<p>この3つの通りを中心に、さまざまな飲食店が営業しています。</p>
<h2>秋田駅からのアクセス</h2>
<p>JR秋田駅の西口から歩くと、20分ほどが目安です。路線バスなら「川反入口」バス停が近くにあります。冬は雪道になるので、時間に余裕をもって出かけましょう。</p>
<div class="callout" data-callout=""><p><strong>公開前の事実確認メモ</strong>（公開時に削除）</p><ul><li>徒歩時間・バス停名は最新の情報を確認する</li><li>地図リンクを追加する</li><li>3つの通りの位置関係を現地で確認する</li></ul></div>
<h2>「川反」という名前の由来</h2>
<p>「川のほとり」を表す言葉は、ふつう「川端」と書きます。川反も、藩政時代には「川端」と書かれていたとされています。</p>
<p>当時の城下町では、旭川をはさんで東側に武家町、西側に町人町が置かれていました。そこで<strong>武士の側から見て「川の反対側」にある町</strong>として「川反」の字が当てられた、という説が伝えられています。</p>
<h2>どんなお店がある？</h2>
<p>川反には、気軽に入れる居酒屋から、カウンターでゆっくり飲めるBAR、ママとの会話やカラオケを楽しめるスナックまで、いろいろなお店があります。お店の種類ごとの違いは「<a href="/articles/bar-and-snack">BARとスナックの違いとは？</a>」で紹介しています。</p>
<h2>はじめての人へのおすすめ</h2>
<ol>
<li>まずは料金がわかりやすいお店を選ぶ</li>
<li>早めの時間帯に1軒目へ</li>
<li>気になったお店はSNSや公式サイトで雰囲気を確認</li>
</ol>
<p>お店選びのコツは「<a href="/articles/choosing-a-shop">初めての川反！お店選びのポイント</a>」で詳しく紹介しています。</p>
<h2>参考にした情報</h2>
<ul><li><a href="https://www.jreast.co.jp/akita/meettheheart/column/article88.html" target="_blank" rel="noopener">JR東日本秋田支社「Meet the Heart」コラム（川反）</a></li><li><a href="https://www.akita-yulala.jp/see/691" target="_blank" rel="noopener">あきた元気ナビ（川反）</a></li></ul>', '秋田市大町の旭川沿いに広がる繁華街「川反（かわばた）」。場所や通りの名前、名前の由来まで、はじめての人向けにまとめました。', 'draft', '秋田市大町の旭川沿いに広がる繁華街「川反（かわばた）」。場所や通りの名前、名前の由来まで、はじめての人向けにまとめました。', '川反 秋田', true)
on conflict (slug) do nothing;
insert into public.article_categories (article_id, category_id)
select a.id, c.id from public.articles a, public.categories c where a.slug = 'what-is-kawabata' and c.slug = 'beginner' on conflict do nothing;
insert into public.tags (name, slug) values ('初心者', 'beginner') on conflict (slug) do nothing;
insert into public.article_tags (article_id, tag_id)
select a.id, t.id from public.articles a, public.tags t where a.slug = 'what-is-kawabata' and t.slug = 'beginner' on conflict do nothing;
insert into public.tags (name, slug) values ('アクセス', 'access') on conflict (slug) do nothing;
insert into public.article_tags (article_id, tag_id)
select a.id, t.id from public.articles a, public.tags t where a.slug = 'what-is-kawabata' and t.slug = 'access' on conflict do nothing;
insert into public.tags (name, slug) values ('歴史', 'history') on conflict (slug) do nothing;
insert into public.article_tags (article_id, tag_id)
select a.id, t.id from public.articles a, public.tags t where a.slug = 'what-is-kawabata' and t.slug = 'history' on conflict do nothing;

insert into public.articles (title, slug, content, excerpt, status, seo_description, focus_keyword, is_featured)
values ('初めての川反！お店選びのポイント', 'choosing-a-shop', '<p>はじめての街でお店を選ぶのは、少し勇気がいるものです。川反には大小さまざまなお店があり、雰囲気も料金の仕組みもお店によって違います。安心して楽しむためのポイントをまとめました。</p>
<h2>1. 料金がわかるお店を選ぶ</h2>
<p>いちばん大切なのは、料金がわかること。メニューに値段が書いてあるか、チャージ（席料）やセット料金があるかを確認しましょう。わからないときは、注文の前に「料金のしくみを教えてください」と聞いて大丈夫です。</p>
<p>かわばた日和では、料金が明確で初来店のお客さまを歓迎しているお店に「<strong>初心者歓迎</strong>」マークを付けています。</p>
<div class="callout" data-callout=""><p>初心者歓迎マークは、①料金が明確 ②初めてのお客さまを歓迎 ③料金の説明に対応 ④不明瞭な追加料金がない、の4点を編集部が確認できたお店に表示しています。</p></div>
<h2>2. お店の種類を知っておく</h2>
<table>
<thead><tr><th>種類</th><th>こんな人に</th></tr></thead>
<tbody>
<tr><td>居酒屋</td><td>食事もしっかりとりたい、グループで行きたい</td></tr>
<tr><td>BAR</td><td>カウンターで一杯をゆっくり楽しみたい</td></tr>
<tr><td>スナック</td><td>お店の人や常連さんとの会話、カラオケを楽しみたい</td></tr>
<tr><td>ダイニング</td><td>食事とお酒をおしゃれな空間で楽しみたい</td></tr>
</tbody>
</table>
<h2>3. 時間帯を選ぶ</h2>
<p>はじめてなら、混み合う前の早めの時間がおすすめです。お店の人と話す余裕もあり、おすすめを聞きやすくなります。</p>
<h2>4. 支払い方法を確認する</h2>
<p>現金のみのお店もあります。カードや電子マネーを使いたい人は、事前に確認しておくと安心です。</p>
<h2>5. 無理をしない</h2>
<p>合わないと感じたら、1杯で切り上げても大丈夫。自分のペースで楽しむのが、川反を好きになるいちばんの近道です。</p>', '料金のわかりやすさ、お店の種類、時間帯。はじめての川反で失敗しないための、お店選びのコツを紹介します。', 'draft', '料金のわかりやすさ、お店の種類、時間帯。はじめての川反で失敗しないための、お店選びのコツを紹介します。', '川反 お店選び', true)
on conflict (slug) do nothing;
insert into public.article_categories (article_id, category_id)
select a.id, c.id from public.articles a, public.categories c where a.slug = 'choosing-a-shop' and c.slug = 'beginner' on conflict do nothing;
insert into public.tags (name, slug) values ('初心者', 'beginner') on conflict (slug) do nothing;
insert into public.article_tags (article_id, tag_id)
select a.id, t.id from public.articles a, public.tags t where a.slug = 'choosing-a-shop' and t.slug = 'beginner' on conflict do nothing;
insert into public.tags (name, slug) values ('料金', 'price') on conflict (slug) do nothing;
insert into public.article_tags (article_id, tag_id)
select a.id, t.id from public.articles a, public.tags t where a.slug = 'choosing-a-shop' and t.slug = 'price' on conflict do nothing;

insert into public.articles (title, slug, content, excerpt, status, seo_description, focus_keyword, is_featured)
values ('BARとスナックの違いとは？', 'bar-and-snack', '<p>川反を歩いていると、BARとスナックの看板をたくさん見かけます。どちらもお酒を楽しむお店ですが、楽しみ方には違いがあります。</p>
<h2>BARの特徴</h2>
<ul>
<li>バーテンダーがカクテルやウイスキーなどを作ってくれる</li>
<li>カウンター席が中心で、一人でも入りやすいお店が多い</li>
<li>チャージ（席料）＋飲んだ分、という料金のお店が多い</li>
</ul>
<p>好みの味を伝えると、おすすめの一杯を作ってくれることも。お酒の知識がなくても大丈夫です。</p>
<h2>スナックの特徴</h2>
<ul>
<li>「ママ」や「マスター」との会話を楽しむお店</li>
<li>カラオケがあるお店が多い</li>
<li>一定時間の飲み放題などの「セット料金」のお店が多い</li>
<li>ボトルキープができるお店もある</li>
</ul>
<p>常連さんとの距離が近く、街の話を聞けるのもスナックの魅力です。</p>
<h2>違いを表にすると</h2>
<table>
<thead><tr><th></th><th>BAR</th><th>スナック</th></tr></thead>
<tbody>
<tr><th>楽しみ方</th><td>お酒そのものを味わう</td><td>会話やカラオケを楽しむ</td></tr>
<tr><th>料金の例</th><td>チャージ＋ドリンク代</td><td>セット料金＋追加分</td></tr>
<tr><th>一人での利用</th><td>しやすいお店が多い</td><td>常連さんが多いお店も</td></tr>
</tbody>
</table>
<div class="callout" data-callout=""><p>料金のしくみはお店によって違います。入店時や注文前に確認するのが安心です。</p></div>
<h2>はじめてならどっち？</h2>
<p>静かに飲みたいならBAR、にぎやかに過ごしたいならスナック、が目安です。どちらも「はじめてです」と伝えると、たいていのお店はやさしく教えてくれます。</p>', 'どちらも夜のお店だけど、何が違うの？楽しみ方や料金のしくみの違いを、はじめての人向けにやさしく解説します。', 'draft', 'どちらも夜のお店だけど、何が違うの？楽しみ方や料金のしくみの違いを、はじめての人向けにやさしく解説します。', 'BAR スナック 違い', false)
on conflict (slug) do nothing;
insert into public.article_categories (article_id, category_id)
select a.id, c.id from public.articles a, public.categories c where a.slug = 'bar-and-snack' and c.slug = 'beginner' on conflict do nothing;
insert into public.article_categories (article_id, category_id)
select a.id, c.id from public.articles a, public.categories c where a.slug = 'bar-and-snack' and c.slug = 'enjoy' on conflict do nothing;
insert into public.tags (name, slug) values ('初心者', 'beginner') on conflict (slug) do nothing;
insert into public.article_tags (article_id, tag_id)
select a.id, t.id from public.articles a, public.tags t where a.slug = 'bar-and-snack' and t.slug = 'beginner' on conflict do nothing;
insert into public.tags (name, slug) values ('BAR', 'bar') on conflict (slug) do nothing;
insert into public.article_tags (article_id, tag_id)
select a.id, t.id from public.articles a, public.tags t where a.slug = 'bar-and-snack' and t.slug = 'bar' on conflict do nothing;
insert into public.tags (name, slug) values ('スナック', 'snack') on conflict (slug) do nothing;
insert into public.article_tags (article_id, tag_id)
select a.id, t.id from public.articles a, public.tags t where a.slug = 'bar-and-snack' and t.slug = 'snack' on conflict do nothing;
insert into public.tags (name, slug) values ('料金', 'price') on conflict (slug) do nothing;
insert into public.article_tags (article_id, tag_id)
select a.id, t.id from public.articles a, public.tags t where a.slug = 'bar-and-snack' and t.slug = 'price' on conflict do nothing;

insert into public.articles (title, slug, content, excerpt, status, seo_description, focus_keyword, is_featured)
values ('川反で一人飲みを楽しむ方法', 'solo-drinking', '<p>一人飲みは、自分のペースで過ごせる気楽な時間です。お店の人や隣の席の人との会話から、新しいお店を教えてもらえることもあります。</p>
<h2>一人飲みに向いているお店</h2>
<ul>
<li><strong>カウンターのあるお店</strong>：お店の人と自然に話せます</li>
<li><strong>BAR</strong>：一人客が多く、静かに過ごせます</li>
<li><strong>小さな居酒屋</strong>：少しずつ色々なつまみを楽しめます</li>
</ul>
<p>かわばた日和の店舗情報では「一人利用OK」で絞り込みができます。</p>
<h2>はじめての一人飲みのコツ</h2>
<ol>
<li>混み合う前の早い時間に行く</li>
<li>「一人です」と伝えて、案内された席に座る</li>
<li>最初の一杯は迷ったら「おすすめは？」と聞いてみる</li>
<li>長居しすぎず、1〜2杯で次へ行くのもあり</li>
</ol>
<h2>お店の人との会話</h2>
<p>無理に話す必要はありません。話しかけられたら、気軽に答えるくらいで大丈夫。地元の人なら、川反のおすすめを教えてもらえるかもしれません。</p>
<h2>帰り道のこと</h2>
<p>お酒を飲んだら運転はしないこと。帰りの交通手段は、出かける前に決めておきましょう。</p>', '一人だからこそ、お店の人との会話やお酒の味をじっくり楽しめます。一人飲みデビューのコツをまとめました。', 'draft', '一人だからこそ、お店の人との会話やお酒の味をじっくり楽しめます。一人飲みデビューのコツをまとめました。', '川反 一人飲み', false)
on conflict (slug) do nothing;
insert into public.article_categories (article_id, category_id)
select a.id, c.id from public.articles a, public.categories c where a.slug = 'solo-drinking' and c.slug = 'enjoy' on conflict do nothing;
insert into public.tags (name, slug) values ('一人飲み', 'solo') on conflict (slug) do nothing;
insert into public.article_tags (article_id, tag_id)
select a.id, t.id from public.articles a, public.tags t where a.slug = 'solo-drinking' and t.slug = 'solo' on conflict do nothing;
insert into public.tags (name, slug) values ('初心者', 'beginner') on conflict (slug) do nothing;
insert into public.article_tags (article_id, tag_id)
select a.id, t.id from public.articles a, public.tags t where a.slug = 'solo-drinking' and t.slug = 'beginner' on conflict do nothing;

insert into public.articles (title, slug, content, excerpt, status, seo_description, focus_keyword, is_featured)
values ('お酒が飲めなくても川反は楽しめる？', 'without-alcohol', '<p>「飲み屋街だから、お酒が飲めないと楽しめないかも」と思っていませんか？実は、お酒を飲まない人にも楽しみ方はたくさんあります。</p>
<h2>ノンアルコールドリンクを頼もう</h2>
<p>ソフトドリンクやノンアルコールビールを置いているお店は少なくありません。BARでは、お酒を使わないカクテル（モクテル）を作ってくれるお店もあります。注文のときに「お酒は飲めないのですが」と伝えてみましょう。</p>
<p>かわばた日和の店舗情報では「ノンアル対応」で絞り込みができます。</p>
<h2>食事を楽しむ</h2>
<p>居酒屋やダイニングでは、食事が主役。秋田の郷土料理を出すお店もあります。</p>
<h2>会話や雰囲気を楽しむ</h2>
<p>川沿いの街並みを歩いたり、お店の人と話したり。お酒がなくても、川反の夜の雰囲気は十分に味わえます。</p>
<h2>周りへの伝え方</h2>
<p>グループで行くときは、事前に「飲めない」と伝えておくと、お店選びもスムーズです。乾杯もソフトドリンクで大丈夫。</p>
<div class="callout" data-callout=""><p>ノンアルコールメニューの有無はお店によって違います。気になるお店は事前に確認しましょう。</p></div>', '答えは「楽しめます」。ノンアルコールドリンクや食事、会話。お酒を飲まない人のための川反の楽しみ方。', 'draft', '答えは「楽しめます」。ノンアルコールドリンクや食事、会話。お酒を飲まない人のための川反の楽しみ方。', '川反 ノンアル', false)
on conflict (slug) do nothing;
insert into public.article_categories (article_id, category_id)
select a.id, c.id from public.articles a, public.categories c where a.slug = 'without-alcohol' and c.slug = 'enjoy' on conflict do nothing;
insert into public.article_categories (article_id, category_id)
select a.id, c.id from public.articles a, public.categories c where a.slug = 'without-alcohol' and c.slug = 'beginner' on conflict do nothing;
insert into public.tags (name, slug) values ('ノンアル', 'non-alcohol') on conflict (slug) do nothing;
insert into public.article_tags (article_id, tag_id)
select a.id, t.id from public.articles a, public.tags t where a.slug = 'without-alcohol' and t.slug = 'non-alcohol' on conflict do nothing;
insert into public.tags (name, slug) values ('初心者', 'beginner') on conflict (slug) do nothing;
insert into public.article_tags (article_id, tag_id)
select a.id, t.id from public.articles a, public.tags t where a.slug = 'without-alcohol' and t.slug = 'beginner' on conflict do nothing;

insert into public.articles (title, slug, content, excerpt, status, seo_description, focus_keyword, is_featured)
values ('川反の二次会を楽しもう', 'nijikai', '<p>一次会が終わったあとの「もう一軒」。川反は、二次会のお店選びにも困らない街です。グループで楽しむためのポイントをまとめました。</p>
<h2>人数と雰囲気でお店を選ぶ</h2>
<ul>
<li><strong>大人数</strong>：席数の多い居酒屋やダイニング、カラオケ</li>
<li><strong>少人数</strong>：BARやスナックで落ち着いて</li>
<li><strong>歌いたい</strong>：カラオケのあるスナックやカラオケ店</li>
</ul>
<h2>予約と予算</h2>
<p>人数が多い日や金曜・土曜は、事前に電話で予約しておくと安心です。予約のときに人数と予算を伝えると、お店も準備しやすくなります。</p>
<h2>幹事さんのチェックリスト</h2>
<ol>
<li>人数と予算を決める</li>
<li>料金のしくみ（セット料金・チャージなど）を確認する</li>
<li>支払い方法を確認する</li>
<li>帰りの交通手段を案内する</li>
</ol>
<h2>帰り道まで気持ちよく</h2>
<p>お酒を飲んだ人は運転しないこと。タクシーや運転代行など、帰り方を決めておきましょう。</p>', '歓送迎会や同窓会のあとに、もう一軒。グループでの二次会を気持ちよく楽しむためのポイントを紹介します。', 'draft', '歓送迎会や同窓会のあとに、もう一軒。グループでの二次会を気持ちよく楽しむためのポイントを紹介します。', '川反 二次会', false)
on conflict (slug) do nothing;
insert into public.article_categories (article_id, category_id)
select a.id, c.id from public.articles a, public.categories c where a.slug = 'nijikai' and c.slug = 'enjoy' on conflict do nothing;
insert into public.tags (name, slug) values ('二次会', 'nijikai') on conflict (slug) do nothing;
insert into public.article_tags (article_id, tag_id)
select a.id, t.id from public.articles a, public.tags t where a.slug = 'nijikai' and t.slug = 'nijikai' on conflict do nothing;

insert into public.articles (title, slug, content, excerpt, status, seo_description, focus_keyword, is_featured)
values ('川反の歴史を知ろう', 'kawabata-history', '<p>いまは飲み屋街として知られる川反ですが、かつては芸者衆が行き交う花街として、全国に名前を知られた時代がありました。川反の歩みをたどります。</p>
<h2>名前は「川の反対側」から？</h2>
<p>藩政時代、この辺りは「川端」と書かれていたとされます。旭川をはさんで東側に武家町、西側に町人町が置かれていたことから、武士の側から見て「川の反対側」の町として「川反」の字が当てられた、という説が伝えられています。</p>
<h2>明治の大火と花街のはじまり</h2>
<p>川反が歓楽街になったきっかけは、<strong>明治19年（1886年）の大火</strong>だと言われています。この火事は「俵屋火事」とも呼ばれ、焼け出された芸者屋や料理店が、町人の町だった川反へ移ってきたことが、花街としての川反の始まりとされています。</p>
<h2>芸者衆が行き交った最盛期</h2>
<p>最盛期は明治の終わりから昭和の初めにかけてとされ、川反芸者の名前は県外にも知られるようになりました。郷土史家の田口松圃は、全盛期を大正の初めから大正12年ごろとしています。</p>
<p>大正8年（1919年）の秋田魁新報の記事によると、芸者置屋は明治43年に13軒、大正5年に27軒、大正8年には35軒まで増え、芸者97人と舞妓47人、あわせて141人がいたとされています。</p>
<blockquote><p>軒先には芸者の名前を書いた軒灯が並び、三味線の音が流れる中を、日本髪に和服姿の芸者たちが行き交った――そんな光景が伝えられています。</p></blockquote>
<h2>いまに受け継がれる文化</h2>
<p>川反芸者は一時途絶えましたが、現在は「会える秋田美人」をキャッチフレーズにした「<strong>あきた舞妓</strong>」として、その文化が受け継がれています。</p>
<p>あきた舞妓の拠点は、千秋公園内にある「<strong>あきた文化産業施設 松下</strong>」。大正時代に創業した料亭「割烹松下」の建物を生かした施設で、舞妓の演舞を見ることができます。</p>
<div class="callout" data-callout=""><p><strong>公開前の事実確認メモ</strong>（公開時に削除）</p><ul><li>年代・軒数・人数は出典の原文（秋田魁新報）で確認する</li><li>「俵屋火事」の名称と年を郷土史資料でも確認する</li><li>あきた舞妓の公演日・料金は公式情報で確認し、本文には載せず公式サイトへリンクする</li></ul></div>
<h2>参考にした情報</h2>
<ul><li><a href="https://www.jreast.co.jp/akita/meettheheart/column/article88.html" target="_blank" rel="noopener">JR東日本秋田支社「Meet the Heart」コラム（川反）</a></li><li><a href="https://www.sakigake.jp/news/article/20211121AK0020/" target="_blank" rel="noopener">秋田魁新報（2021年11月21日掲載記事）</a></li><li><a href="https://www.ana.co.jp/ja/us/japan-travel-planner/akita/0000006.html" target="_blank" rel="noopener">ANA Japan Travel Planner（あきた舞妓・松下）</a></li><li><a href="https://www.akita-yulala.jp/see/691" target="_blank" rel="noopener">あきた元気ナビ（川反）</a></li></ul>', '明治の大火をきっかけに花街として栄え、芸者衆が行き交った川反。その歩みと、いまに受け継がれる文化をたどります。', 'draft', '明治の大火をきっかけに花街として栄え、芸者衆が行き交った川反。その歩みと、いまに受け継がれる文化をたどります。', '川反 歴史', true)
on conflict (slug) do nothing;
insert into public.article_categories (article_id, category_id)
select a.id, c.id from public.articles a, public.categories c where a.slug = 'kawabata-history' and c.slug = 'history' on conflict do nothing;
insert into public.tags (name, slug) values ('歴史', 'history') on conflict (slug) do nothing;
insert into public.article_tags (article_id, tag_id)
select a.id, t.id from public.articles a, public.tags t where a.slug = 'kawabata-history' and t.slug = 'history' on conflict do nothing;
insert into public.tags (name, slug) values ('芸者・舞妓', 'geigi') on conflict (slug) do nothing;
insert into public.article_tags (article_id, tag_id)
select a.id, t.id from public.articles a, public.tags t where a.slug = 'kawabata-history' and t.slug = 'geigi' on conflict do nothing;

insert into public.articles (title, slug, content, excerpt, status, seo_description, focus_keyword, is_featured)
values ('川反で働く人々 ― 連載をはじめます', 'people-of-kawabata', '<p>川反の魅力は、お店そのものだけではありません。カウンターの向こうで迎えてくれる人、長く街を見守ってきた人、新しくお店を始めた人。そこで働く人たちがいるからこそ、川反は温かい街なのだと思います。</p>
<h2>連載「川反の人々」について</h2>
<p>かわばた日和では、川反で働く人たちへのインタビューを連載していきます。</p>
<ul>
<li>お店を始めたきっかけ</li>
<li>川反という街への思い</li>
<li>はじめてのお客さんへのメッセージ</li>
</ul>
<p>そんなお話を、写真とともにお届けする予定です。</p>
<h2>取材にご協力いただける方を募集しています</h2>
<p>川反でお店を営んでいる方、働いている方で、取材にご協力いただける方は<a href="/contact">お問い合わせ</a>からご連絡ください。掲載前には必ず内容をご確認いただきます。</p>
<div class="callout" data-callout=""><p><strong>公開前の事実確認メモ</strong>（公開時に削除）</p><ul><li>この記事は連載の予告です。実際のインタビュー記事は取材後に作成する</li></ul></div>', 'お店を営む人、カウンターに立つ人、街を支える人。川反で働く人々のストーリーを届ける連載の予告です。', 'draft', 'お店を営む人、カウンターに立つ人、街を支える人。川反で働く人々のストーリーを届ける連載の予告です。', '川反 人', false)
on conflict (slug) do nothing;
insert into public.article_categories (article_id, category_id)
select a.id, c.id from public.articles a, public.categories c where a.slug = 'people-of-kawabata' and c.slug = 'people' on conflict do nothing;
insert into public.tags (name, slug) values ('連載', 'rensai') on conflict (slug) do nothing;
insert into public.article_tags (article_id, tag_id)
select a.id, t.id from public.articles a, public.tags t where a.slug = 'people-of-kawabata' and t.slug = 'rensai' on conflict do nothing;
insert into public.tags (name, slug) values ('インタビュー', 'interview') on conflict (slug) do nothing;
insert into public.article_tags (article_id, tag_id)
select a.id, t.id from public.articles a, public.tags t where a.slug = 'people-of-kawabata' and t.slug = 'interview' on conflict do nothing;
insert into public.tags (name, slug) values ('編集部より', 'editorial') on conflict (slug) do nothing;
insert into public.article_tags (article_id, tag_id)
select a.id, t.id from public.articles a, public.tags t where a.slug = 'people-of-kawabata' and t.slug = 'editorial' on conflict do nothing;

insert into public.articles (title, slug, content, excerpt, status, seo_description, focus_keyword, is_featured)
values ('川反の未来を考える', 'future-of-kawabata', '<p>花街として栄えた時代から、飲み屋街として親しまれる今まで、川反は形を変えながら続いてきました。これからの川反は、どんな街になっていくのでしょうか。</p>
<h2>「入りにくい」を減らしたい</h2>
<p>「料金がわからなくて不安」「常連さんばかりで入りにくそう」。はじめての人からは、そんな声をよく聞きます。お店の情報や料金のしくみが前もってわかれば、その不安は小さくできるはずです。</p>
<h2>いろいろな人が楽しめる街へ</h2>
<p>一人で飲みたい人、お酒を飲まない人、女性同士のグループ、転勤や移住で秋田に来た人。いろいろな人が、それぞれの楽しみ方を見つけられる街になればと考えています。</p>
<h2>お店同士がつながる街へ</h2>
<p>「次はあのお店に行ってみたら？」とお店同士が紹介しあえる街は、歩く楽しさが広がります。かわばた日和が、そのきっかけのひとつになれたらうれしいです。</p>
<h2>みなさんの声を聞かせてください</h2>
<p>川反のこれからについて、アイデアや思いがあれば<a href="/contact">お問い合わせ</a>から教えてください。</p>', '若い世代や女性、はじめての人にも開かれた街へ。これからの川反について、編集部が考えていることを書きました。', 'draft', '若い世代や女性、はじめての人にも開かれた街へ。これからの川反について、編集部が考えていることを書きました。', '川反 未来', false)
on conflict (slug) do nothing;
insert into public.article_categories (article_id, category_id)
select a.id, c.id from public.articles a, public.categories c where a.slug = 'future-of-kawabata' and c.slug = 'future' on conflict do nothing;
insert into public.tags (name, slug) values ('編集部より', 'editorial') on conflict (slug) do nothing;
insert into public.article_tags (article_id, tag_id)
select a.id, t.id from public.articles a, public.tags t where a.slug = 'future-of-kawabata' and t.slug = 'editorial' on conflict do nothing;

insert into public.articles (title, slug, content, excerpt, status, seo_description, focus_keyword, is_featured)
values ('かわばた日和を始めた理由', 'why-we-started', '<p>はじめまして。「かわばた日和」は、秋田市の繁華街・川反の魅力を発信する地域Webマガジンです。</p>
<h2>なぜ始めたのか</h2>
<p>川反には、魅力的なお店や人、長い歴史があります。それなのに「行ったことがない」「どんな街かわからない」という人も少なくありません。川反を知るきっかけをつくり、街全体のにぎわいにつなげたい。そんな思いから、このメディアを始めました。</p>
<h2>大切にしていること</h2>
<ol>
<li><strong>確かな情報だけを載せる</strong>：店舗情報は確認した日付とあわせて掲載します。</li>
<li><strong>川反全体を紹介する</strong>：特定のお店に偏らず、街全体の魅力を伝えます。</li>
<li><strong>広告は広告とわかるように</strong>：タイアップ記事には「PR」と表示します。</li>
<li><strong>AIの使い方を明らかに</strong>：記事づくりにAIを使うことがありますが、必ず編集部が確認してから公開します。AIで作った画像には「イメージ画像」と表示します。</li>
</ol>
<h2>運営について</h2>
<p>かわばた日和は、Café &amp; Bar Sereness が運営しています。運営者のお店だけでなく、川反全体を紹介するメディアとして独立して運営していきます。</p>
<p>掲載のご相談や情報提供は、<a href="/contact">お問い合わせ</a>からお寄せください。</p>', '川反を、もっと身近に、もっと楽しく。地域Webマガジン「かわばた日和」を始めた理由と、大切にしていることをお伝えします。', 'draft', '川反を、もっと身近に、もっと楽しく。地域Webマガジン「かわばた日和」を始めた理由と、大切にしていることをお伝えします。', 'かわばた日和', false)
on conflict (slug) do nothing;
insert into public.article_categories (article_id, category_id)
select a.id, c.id from public.articles a, public.categories c where a.slug = 'why-we-started' and c.slug = 'news' on conflict do nothing;
insert into public.article_categories (article_id, category_id)
select a.id, c.id from public.articles a, public.categories c where a.slug = 'why-we-started' and c.slug = 'future' on conflict do nothing;
insert into public.tags (name, slug) values ('編集部より', 'editorial') on conflict (slug) do nothing;
insert into public.article_tags (article_id, tag_id)
select a.id, t.id from public.articles a, public.tags t where a.slug = 'why-we-started' and t.slug = 'editorial' on conflict do nothing;

-- 公開情報をもとに調べたお店（お店には未確認。0002_shop_sources.sql の後に実行）
insert into public.shops (name, slug, category, description, address, business_hours, closed_days, price_range, solo_ok, non_alcohol, beginner_welcome, sns, website, verified_at, is_published, sources, shop_confirmed)
values ('Café & Bar Sereness', 'cafe-bar-sereness', 'bar', 'カラオケ・ゲーム・スポーツ観戦も楽しめるカフェ&バー。飲み放題が基本料金で、ソフトドリンクの飲み放題もあり、お酒を飲まない人や一人での来店も歓迎と案内されています。かわばた日和の運営元です。', '秋田県秋田市大町5-2-7 SCビル2F', '月・火・木 19:00〜1:00／金・土・祝前日 19:00〜3:00', '水曜日', 'アルコール飲み放題 男性2,650円・女性1,100円／ソフトドリンク飲み放題 男性1,100円・女性550円', true, true, false, '{"instagram":"https://www.instagram.com/cafe_bar.sereness/"}'::jsonb, 'https://sereness25-cyber.github.io/sereness.main1/', '2026-11-09', true, '[{"label":"Café & Bar Sereness 公式サイト（運営元）","url":"https://sereness25-cyber.github.io/sereness.main1/"}]'::jsonb, true)
on conflict (slug) do nothing;
insert into public.shops (name, slug, category, description, address, business_hours, closed_days, price_range, solo_ok, non_alcohol, beginner_welcome, sns, website, verified_at, is_published, sources, shop_confirmed)
values ('秋田川反漁屋酒場 秋田本店', 'kawabata-isariya-sakaba', 'izakaya', '新鮮な魚介類と秋田の郷土料理・地酒を楽しめる居酒屋として紹介されています。自分で炙って仕上げるきりたんぽ鍋が特徴とされています。', '秋田県秋田市大町4-2-35', '17:00〜24:00', '無休', '', null, null, false, '{}'::jsonb, 'https://marutomisuisan.jpn.com/isariya-akita/', '2026-11-09', true, '[{"label":"公式サイト（丸富水産）","url":"https://marutomisuisan.jpn.com/isariya-akita/"},{"label":"あきた元気ナビ","url":"https://www.akita-yulala.jp/restaurant/658"}]'::jsonb, false)
on conflict (slug) do nothing;
insert into public.shops (name, slug, category, description, address, business_hours, closed_days, price_range, solo_ok, non_alcohol, beginner_welcome, sns, website, verified_at, is_published, sources, shop_confirmed)
values ('秋田きりたんぽ屋 秋田大町分店', 'akita-kiritanpoya-omachi', 'izakaya', 'きりたんぽ鍋を名物に、マタギ鍋やハタハタのしょっつる鍋など秋田の郷土料理を扱う居酒屋として紹介されています。営業時間は掲載先によって違うため、お出かけ前にお店へご確認ください。', '秋田県秋田市大町4-2-20', '', '', '', null, null, false, '{}'::jsonb, null, '2026-11-09', true, '[{"label":"あきた元気ナビ","url":"https://www.akita-yulala.jp/restaurant/5000018832"},{"label":"一休.comレストラン","url":"https://restaurant.ikyu.com/147601"},{"label":"川反外町振興会","url":"https://kawabatatomachi.com/2018/04/24/%E7%A7%8B%E7%94%B0%E3%81%8D%E3%82%8A%E3%81%9F%E3%82%93%E3%81%BD%E5%B1%8B%E3%80%80%E5%A4%A7%E7%94%BA%E5%88%86%E5%BA%97/"}]'::jsonb, false)
on conflict (slug) do nothing;
insert into public.shops (name, slug, category, description, address, business_hours, closed_days, price_range, solo_ok, non_alcohol, beginner_welcome, sns, website, verified_at, is_published, sources, shop_confirmed)
values ('BAR ル・ヴェール', 'bar-le-verre', 'bar', '秋田市大町・川反のバー。公式サイトでは「女性の一人飲みに人気」と紹介されています。JR秋田駅西口から徒歩16分。', '秋田県秋田市大町4-1-5', '18:00〜1:00（L.O. 0:30）', '日曜日、第1・第3月曜日（月曜が祝日の場合は日曜営業・翌月曜休み）', '', true, null, false, '{}'::jsonb, 'https://www.bar-leverre.com/', '2026-11-09', true, '[{"label":"BAR ル・ヴェール 公式サイト","url":"https://www.bar-leverre.com/"}]'::jsonb, false)
on conflict (slug) do nothing;
insert into public.shops (name, slug, category, description, address, business_hours, closed_days, price_range, solo_ok, non_alcohol, beginner_welcome, sns, website, verified_at, is_published, sources, shop_confirmed)
values ('BARアラジン', 'bar-aladdin', 'bar', 'ダーツとカラオケを楽しめる飲み放題のバーとして紹介されています。赤れんが郷土館前バス停から徒歩約1分。', '秋田県秋田市大町3-2-22 ジャスマックビル1F', '', '', '', null, null, false, '{}'::jsonb, null, '2026-11-09', true, '[{"label":"エキテン","url":"https://www.ekiten.jp/shop_36158497/info/p7/"}]'::jsonb, false)
on conflict (slug) do nothing;
insert into public.shops (name, slug, category, description, address, business_hours, closed_days, price_range, solo_ok, non_alcohol, beginner_welcome, sns, website, verified_at, is_published, sources, shop_confirmed)
values ('炭火やきとりと竈めし 一の酉 秋田川反店', 'ichinotori-kawabata', 'izakaya', '炭火やきとりと竈（かまど）で炊くごはんの店。', '秋田県秋田市大町3-2-30 シャインズビル1F', '', '', '', null, null, false, '{}'::jsonb, null, '2026-11-09', true, '[{"label":"NAVITIME（秋田市大町の居酒屋一覧）","url":"https://www.navitime.co.jp/category/0308001/05201052000/"}]'::jsonb, false)
on conflict (slug) do nothing;
insert into public.shops (name, slug, category, description, address, business_hours, closed_days, price_range, solo_ok, non_alcohol, beginner_welcome, sns, website, verified_at, is_published, sources, shop_confirmed)
values ('いろり家 秋田川反店', 'irori-ya-kawabata', 'izakaya', '秋田市大町・川反の居酒屋。', '秋田県秋田市大町4-2-26', '', '', '', null, null, false, '{}'::jsonb, null, '2026-11-09', true, '[{"label":"NAVITIME（秋田市大町の居酒屋一覧）","url":"https://www.navitime.co.jp/category/0308001/05201052000/"}]'::jsonb, false)
on conflict (slug) do nothing;
insert into public.shops (name, slug, category, description, address, business_hours, closed_days, price_range, solo_ok, non_alcohol, beginner_welcome, sns, website, verified_at, is_published, sources, shop_confirmed)
values ('薄利多賣半兵エ 秋田川反店', 'hanbee-kawabata', 'izakaya', '秋田市大町・川反の居酒屋。', '秋田県秋田市大町5-1-3 八番館ビル1F', '', '', '', null, null, false, '{}'::jsonb, null, '2026-11-09', true, '[{"label":"NAVITIME（秋田市大町の居酒屋一覧）","url":"https://www.navitime.co.jp/category/0308001/05201052000/"}]'::jsonb, false)
on conflict (slug) do nothing;
insert into public.shops (name, slug, category, description, address, business_hours, closed_days, price_range, solo_ok, non_alcohol, beginner_welcome, sns, website, verified_at, is_published, sources, shop_confirmed)
values ('川反軒', 'kawabata-ken', 'izakaya', '秋田市大町・川反の居酒屋。', '秋田県秋田市大町5丁目2-42', '', '', '', null, null, false, '{}'::jsonb, null, '2026-11-09', true, '[{"label":"Yahoo!マップ","url":"https://map.yahoo.co.jp/v3/place/B6E9aZPgVW2"}]'::jsonb, false)
on conflict (slug) do nothing;
insert into public.shops (name, slug, category, description, address, business_hours, closed_days, price_range, solo_ok, non_alcohol, beginner_welcome, sns, website, verified_at, is_published, sources, shop_confirmed)
values ('川反 日なた', 'kawabata-hinata', 'izakaya', '秋田市大町・川反の居酒屋。', '秋田県秋田市大町4丁目1-14', '', '', '', null, null, false, '{}'::jsonb, null, '2026-11-09', true, '[{"label":"Yahoo!マップ","url":"https://map.yahoo.co.jp/v3/place/FujyaXQyjQE"}]'::jsonb, false)
on conflict (slug) do nothing;
insert into public.shops (name, slug, category, description, address, business_hours, closed_days, price_range, solo_ok, non_alcohol, beginner_welcome, sns, website, verified_at, is_published, sources, shop_confirmed)
values ('四丁目 炭火焼 紅がら屋', 'beniga-raya', 'izakaya', '秋田市大町・川反の炭火焼の店。', '秋田県秋田市大町4-2-34', '', '', '', null, null, false, '{}'::jsonb, null, '2026-11-09', true, '[{"label":"ホームメイト（秋田市大町の居酒屋一覧）","url":"https://www.cookdoor.jp/akita/jc05201/zip0100921/list/izakaya/"}]'::jsonb, false)
on conflict (slug) do nothing;
insert into public.shops (name, slug, category, description, address, business_hours, closed_days, price_range, solo_ok, non_alcohol, beginner_welcome, sns, website, verified_at, is_published, sources, shop_confirmed)
values ('手づくり料理 一楽土', 'ichirakudo', 'izakaya', '秋田市大町・川反の手づくり料理の店。', '秋田県秋田市大町5-2-41', '', '', '', null, null, false, '{}'::jsonb, null, '2026-11-09', true, '[{"label":"ホームメイト（秋田市大町の居酒屋一覧）","url":"https://www.cookdoor.jp/akita/jc05201/zip0100921/list/izakaya/"}]'::jsonb, false)
on conflict (slug) do nothing;
insert into public.shops (name, slug, category, description, address, business_hours, closed_days, price_range, solo_ok, non_alcohol, beginner_welcome, sns, website, verified_at, is_published, sources, shop_confirmed)
values ('お多福', 'otafuku', 'izakaya', '秋田の郷土料理を味わえる店として紹介されています。', '秋田県秋田市大町4-2-25', '', '', '', null, null, false, '{}'::jsonb, null, '2026-11-09', true, '[{"label":"るるぶ＆more.（秋田の郷土料理の名店案内）","url":"https://plus.rurubu.jp/article/6ah22brietv"}]'::jsonb, false)
on conflict (slug) do nothing;
insert into public.shops (name, slug, category, description, address, business_hours, closed_days, price_range, solo_ok, non_alcohol, beginner_welcome, sns, website, verified_at, is_published, sources, shop_confirmed)
values ('ちゃわん屋', 'chawanya', 'izakaya', '秋田の郷土料理を味わえる店として紹介されています。', '秋田県秋田市大町4-2-7', '', '', '', null, null, false, '{}'::jsonb, null, '2026-11-09', true, '[{"label":"るるぶ＆more.（秋田の郷土料理の名店案内）","url":"https://plus.rurubu.jp/article/6ah22brietv"}]'::jsonb, false)
on conflict (slug) do nothing;