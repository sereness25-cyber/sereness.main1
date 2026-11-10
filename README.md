# Café & Bar Sereness ランディングページ

秋田市大町の Café & Bar Sereness のLPと、営業スケジュール・人気メニュー・店内ギャラリーの管理ページ。

| ファイル | 内容 |
|---|---|
| `index.html` | LP本体(写真はファイル内に埋め込み) |
| `schedule-admin.html` | 管理ページ(単体で開く版) |
| `apps-script/Code.gs` | Google Apps Script(営業データの保存・写真のドライブ保存) |
| `apps-script/admin.html` | Apps Script に入れる管理ページ(`…/exec?page=admin` で開く) |
| `kawabata-biyori/` | 川反の地域Webマガジン「かわばた日和」(Next.js + Supabase)。詳しくは `kawabata-biyori/README.md` |

## Apps Script の更新手順

1. `Code.gs` と `admin`(HTML)を差し替える
2. 「デプロイ」→「デプロイを管理」→ 鉛筆 →「新バージョン」でデプロイ(URLは変わらない)
3. スクリプト プロパティに `PASSCODE`(管理ページの合言葉)を設定しておく

## かわばた日和の管理ページ(ログインなしで使える)

- URL: https://sereness25-cyber.github.io/sereness.main1/kawabata-admin/
- 保存先はこの Apps Script(`Code.gs` の下のほう)。記事・お店・イベントはドライブの「かわばた日和 データ」フォルダ、写真は「かわばた日和 写真」フォルダに入る
- ログイン画面なしで開ける。URL を知っている人は誰でも編集できるので、URL は人に教えないこと
- 鍵をかけたくなったら、スクリプト プロパティに `KAWABATA_PASSWORD` を入れる(そのときだけパスワード画面が出る。10回続けて間違えると15分ロック)
- GitHub Actions(かわばた日和を書き出す)が10分ごとに `…/exec?kawabata=export` から公開中のものだけを取り込み、公開ページを作り直す。保存してから10〜15分ほどで反映される

## かわばた日和「本日営業のお店」

- トップページの「TODAY’S KAWABATA」と、一覧ページ（/kawabata/shops/today.html）。スマホでは画面下の「🌃 本日営業のお店」ボタンからも開ける
- 営業状態はブラウザが日本時間で判定する（`kawabata-biyori/public/js/kawabata-hours.js`。朝5時を営業日の区切りにし、深夜0時をまたぐ営業は前日の営業として扱う）。テストは `node kawabata-biyori/scripts/test-hours.mjs`
- 営業時間は管理ページの「お店」→ 各お店の「営業時間（本日営業のお店）」で登録。未登録のお店は表示しない
- お店の人が自分で変えるときは、お店の編集画面の「お店用の管理ページ」で合言葉を発行し、URL（kawabata-admin/shop.html?s=スラッグ）と一緒に伝える。お店が変えられるのは、自分のお店の営業時間と臨時休業だけ
- Café & Bar Sereness の営業時間は、お店の営業スケジュール管理ページ（schedule-admin.html）の内容がそのまま使われる
- 公開ページは数分ごとに Apps Script（`…/exec?kawabata=today`）から最新の営業時間を読むので、臨時休業はページの作り直しを待たずに反映される
