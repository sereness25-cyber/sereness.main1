# Café & Bar Sereness ランディングページ

秋田市大町の Café & Bar Sereness のLPと、営業スケジュール・人気メニュー・店内ギャラリーの管理ページ。

| ファイル | 内容 |
|---|---|
| `index.html` | LP本体(写真はファイル内に埋め込み) |
| `schedule-admin.html` | 管理ページ(単体で開く版) |
| `apps-script/Code.gs` | Google Apps Script(営業データの保存・写真のドライブ保存) |
| `apps-script/admin.html` | Apps Script に入れる管理ページ(`…/exec?page=admin` で開く) |

## Apps Script の更新手順

1. `Code.gs` と `admin`(HTML)を差し替える
2. 「デプロイ」→「デプロイを管理」→ 鉛筆 →「新バージョン」でデプロイ(URLは変わらない)
3. スクリプト プロパティに `PASSCODE`(管理ページの合言葉)を設定しておく
