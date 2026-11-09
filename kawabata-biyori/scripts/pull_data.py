"""管理ページ（Apps Script）から公開中のデータを取り込み、kawabata-data/ を書き換える。

使い方: python3 -I pull_data.py <Apps Script の exec URL> <kawabata-data のパス>
- 公開してよいもの（公開中の記事・お店・イベント）だけが返ってくる
- ドライブの写真は kawabata-data/images/drive/ にダウンロードして、URL を GitHub Pages のものに置き換える
- 返事がおかしいとき（Apps Script が古いままなど）は何も書き換えずに終わる
"""
import json
import os
import re
import sys
import urllib.request

PAGES_MEDIA = "https://sereness25-cyber.github.io/sereness.main1/kawabata-data/images/drive"
DRIVE_URL = re.compile(r"https://lh3\.googleusercontent\.com/d/([A-Za-z0-9_-]{10,200})")


def fetch(url, timeout=60):
    req = urllib.request.Request(url, headers={"User-Agent": "kawabata-biyori-sync"})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return res.read()


def main():
    api, data_dir = sys.argv[1], sys.argv[2]
    try:
        payload = json.loads(fetch(api + "?kawabata=export").decode("utf-8"))
    except Exception as e:  # noqa: BLE001
        print(f"::warning::管理ページのデータを取れませんでした: {e}")
        return
    keys = ["articles", "shops", "events", "categories"]
    if not isinstance(payload, dict) or payload.get("kb") != 1 or not all(isinstance(payload.get(k), list) for k in keys) or not isinstance(payload.get("settings"), dict):
        print("::warning::Apps Script の返事が想定と違います（新しいバージョンでデプロイされていない可能性があります）。今回は取り込みません。")
        return
    if not payload["categories"]:
        print("::warning::カテゴリーが空です。念のため取り込みません（Apps Script のエディタで kawabataSetup を実行してください）。")
        return
    try:
        with open(os.path.join(data_dir, "articles.json"), encoding="utf-8") as f:
            had = len(json.load(f)["articles"])
    except Exception:  # noqa: BLE001
        had = 0
    if had and not payload["articles"]:
        print("::warning::公開中の記事が0件の返事でした。念のため取り込みません。")
        return

    text = json.dumps(payload, ensure_ascii=False)
    img_dir = os.path.join(data_dir, "images", "drive")
    for file_id in sorted(set(DRIVE_URL.findall(text))):
        dest = os.path.join(img_dir, file_id + ".webp")
        if os.path.exists(dest):
            continue
        try:
            body = fetch(f"https://drive.google.com/uc?export=download&id={file_id}")
        except Exception as e:  # noqa: BLE001
            print(f"::warning::写真 {file_id} を取れませんでした: {e}")
            continue
        if body[:4] != b"RIFF" and body[:3] != b"\xff\xd8\xff" and body[:8] != b"\x89PNG\r\n\x1a\n":
            print(f"::warning::写真 {file_id} が画像ではありませんでした（共有設定を確認してください）")
            continue
        os.makedirs(img_dir, exist_ok=True)
        with open(dest, "wb") as f:
            f.write(body)
        print(f"写真を取り込みました: {file_id}")

    def local(m):
        fid = m.group(1)
        return f"{PAGES_MEDIA}/{fid}.webp" if os.path.exists(os.path.join(img_dir, fid + ".webp")) else m.group(0)

    payload = json.loads(DRIVE_URL.sub(local, text))
    for k in keys:
        write(os.path.join(data_dir, k + ".json"), {k: payload[k]})
    write(os.path.join(data_dir, "settings.json"), payload["settings"])
    print(f"取り込みました: 記事 {len(payload['articles'])} / お店 {len(payload['shops'])} / イベント {len(payload['events'])}")


def write(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
