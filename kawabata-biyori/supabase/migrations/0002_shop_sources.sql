-- 店舗情報の出典と、お店本人に確認済みかどうか
alter table public.shops add column if not exists sources jsonb not null default '[]'::jsonb;
alter table public.shops add column if not exists shop_confirmed boolean not null default false;
comment on column public.shops.sources is '情報の出典 [{"label": "...", "url": "https://..."}]';
comment on column public.shops.shop_confirmed is 'お店本人に掲載内容を確認済みなら true。false のときは「公開情報をもとに掲載」と表示する';
comment on column public.shops.verified_at is '情報の確認日（shop_confirmed=false のときは公開情報を調べた日）';
