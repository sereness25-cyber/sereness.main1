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

## かわばた日和の管理ページ(パスワードだけで使える)

- URL: https://sereness25-cyber.github.io/sereness.main1/kawabata-admin/
- 保存先はこの Apps Script(`Code.gs` の下のほう)。記事・お店・イベントはドライブの「かわばた日和 データ」フォルダ、写真は「かわばた日和 写真」フォルダに入る
- パスワードはスクリプト プロパティの `KAWABATA_PASSWORD`。設定していなければ `PASSCODE`(お店の管理ページの合言葉)で入れる
- 10回続けて間違えると15分間ログインできなくなる
- GitHub Actions(かわばた日和を書き出す)が10分ごとに `…/exec?kawabata=export` から公開中のものだけを取り込み、公開ページを作り直す。保存してから10〜15分ほどで反映される
