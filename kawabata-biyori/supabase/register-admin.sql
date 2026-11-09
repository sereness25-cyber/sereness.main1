-- 管理者の登録
-- 1. Supabase の Authentication → Users → 「Add user」でメールアドレスとパスワードを決めてユーザーを作る
-- 2. 下の「ここにメールアドレス」を、そのメールアドレスに書き換えて SQL Editor で実行する
insert into public.admin_profiles (user_id, display_name)
select id, '編集部' from auth.users where email = 'ここにメールアドレス'
on conflict (user_id) do nothing;

-- 登録できたか確認（1行出ればOK）
select a.user_id, u.email from public.admin_profiles a join auth.users u on u.id = a.user_id;
