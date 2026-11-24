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
import time
import urllib.parse
import urllib.request

PAGES_MEDIA = "https://sereness25-cyber.github.io/sereness.main1/kawabata-data/images/drive"
GSI = "https://msearch.gsi.go.jp/address-search/AddressSearch?q="
# 川反のあたり（これより外になった検索結果は、まちがいとして使わない）
AREA = {"lat": (39.70, 39.74), "lng": (140.10, 140.14)}
DRIVE_URL = re.compile(r"https://lh3\.googleusercontent\.com/d/([A-Za-z0-9_-]{10,200})")


def fetch(url, timeout=60):
    req = urllib.request.Request(url, headers={"User-Agent": "kawabata-biyori-sync"})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return res.read()


def report_version(api):
    """いま動いている Apps Script の版を記録に出す（管理画面の「古いまま」表示の確認用）"""
    try:
        req = urllib.request.Request(api, data=b'{"action":"kb_login"}', headers={"Content-Type": "text/plain;charset=utf-8", "User-Agent": "kawabata-biyori-sync"})
        with urllib.request.urlopen(req, timeout=60) as res:
            j = json.loads(res.read().decode("utf-8"))
        print(f"Apps Script の版: v={j.get('v')} kb={j.get('kb')} ok={j.get('ok')} error={j.get('error')}")
    except Exception as e:  # noqa: BLE001
        print(f"Apps Script の版を確かめられませんでした: {e}")
    try:
        t = json.loads(fetch(api + "?kawabata=today").decode("utf-8"))
        print(f"本日営業のAPI: kb={t.get('kb')} お店={len(t.get('shops') or [])}")
    except Exception as e:  # noqa: BLE001
        print(f"本日営業のAPI: なし（{str(e)[:80]}）")


def main():
    api, data_dir = sys.argv[1], sys.argv[2]
    report_version(api)
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
        # カテゴリーは管理画面では編集しないので、保存先が空なら今のファイルをそのまま使う
        try:
            with open(os.path.join(data_dir, "categories.json"), encoding="utf-8") as f:
                payload["categories"] = json.load(f)["categories"]
        except Exception:  # noqa: BLE001
            payload["categories"] = []
        if not payload["categories"]:
            print("::warning::カテゴリーが空です。念のため取り込みません。")
            return
    try:
        with open(os.path.join(data_dir, "articles.json"), encoding="utf-8") as f:
            had = len(json.load(f)["articles"])
    except Exception:  # noqa: BLE001
        had = 0
    if had and not payload["articles"]:
        print("::warning::公開中の記事が0件の返事でした（管理画面で「公開中のお店・記事を取り込む」を押してください）。今回は取り込みません。")
        return
    try:
        with open(os.path.join(data_dir, "shops.json"), encoding="utf-8") as f:
            had_shops = len(json.load(f)["shops"])
    except Exception:  # noqa: BLE001
        had_shops = 0
    if had_shops and not payload["shops"]:
        print("::warning::公開中のお店が0件の返事でした。念のため取り込みません。")
        return

    # 削除したもの（kawabata-data/removed.json）は取り込まない
    try:
        with open(os.path.join(data_dir, "removed.json"), encoding="utf-8") as f:
            removed = json.load(f)
    except Exception:  # noqa: BLE001
        removed = {}
    for k in ("articles", "shops", "events"):
        gone = set(removed.get(k) or [])
        payload[k] = [x for x in payload[k] if not (isinstance(x, dict) and x.get("id") in gone)]

    # GitHub 側で追加・更新したもの（kawabata-data/pending.json）は、ドライブより新しければこちらを使う
    try:
        with open(os.path.join(data_dir, "pending.json"), encoding="utf-8") as f:
            pending = json.load(f)
    except Exception:  # noqa: BLE001
        pending = {}
    for k in ("articles", "shops", "events"):
        gone = set(removed.get(k) or [])
        for item in pending.get(k) or []:
            if not isinstance(item, dict) or item.get("id") in gone:
                continue
            if k == "articles" and item.get("status") not in ("published", "scheduled"):
                continue
            idx = next((i for i, x in enumerate(payload[k]) if isinstance(x, dict) and x.get("id") == item["id"]), -1)
            if idx < 0:
                payload[k].insert(0, item)
            elif str(item.get("updated_at") or "") > str(payload[k][idx].get("updated_at") or ""):
                payload[k][idx] = item

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
    geocode(payload["shops"], data_dir)
    for k in keys:
        write(os.path.join(data_dir, k + ".json"), {k: payload[k]})
    write(os.path.join(data_dir, "settings.json"), payload["settings"])
    print(f"取り込みました: 記事 {len(payload['articles'])} / お店 {len(payload['shops'])} / イベント {len(payload['events'])}")


def street_address(address):
    """建物名や階を外して「秋田県秋田市大町5-2-7」の形にする（全角の数字やハイフンも直す）"""
    a = str(address or "").translate(str.maketrans("０１２３４５６７８９－ー―‐　", "0123456789---- ")).strip()
    # 番地のあとの空白から先（建物名・階）は使わない
    m = re.match(r"^(\S+?\d+(?:丁目)?-?\d+(?:-\d+)?)(?!\d)", a)
    return m.group(1) if m else ""


def geocode(shops, data_dir):
    """地図の位置（緯度・経度）が入っていないお店に、住所から位置を入れる（国土地理院の住所検索。結果は覚えておく）"""
    path = os.path.join(data_dir, "geocode-cache.json")
    try:
        with open(path, encoding="utf-8") as f:
            cache = json.load(f)
    except Exception:  # noqa: BLE001
        cache = {}
    changed = False
    for s in shops:
        if not isinstance(s, dict) or (s.get("lat") is not None and s.get("lng") is not None):
            continue
        key = street_address(s.get("address"))
        if not key:
            continue
        if key not in cache:
            hit = None
            try:
                res = json.loads(fetch(GSI + urllib.parse.quote(key), timeout=20).decode("utf-8"))
                for r in res or []:
                    lng, lat = r["geometry"]["coordinates"][:2]
                    if AREA["lat"][0] <= lat <= AREA["lat"][1] and AREA["lng"][0] <= lng <= AREA["lng"][1]:
                        hit = [round(lat, 6), round(lng, 6)]
                        break
            except Exception as e:  # noqa: BLE001
                print(f"::warning::住所から位置を調べられませんでした（{key}）: {e}")
                continue
            cache[key] = hit
            changed = True
            time.sleep(0.3)
            print(f"地図の位置: {s.get('name')} → {hit or '見つからず'}")
        if cache.get(key):
            s["lat"], s["lng"] = cache[key]
    if changed:
        with open(path, "w", encoding="utf-8") as f:
            f.write(json.dumps(cache, ensure_ascii=False, indent=2, sort_keys=True) + "\n")


def write(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
