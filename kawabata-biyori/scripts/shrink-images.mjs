// アップロードされた写真を、表示に十分な大きさまで小さくする（1回だけ。済んだものは .optimized.json に記録）
//   node scripts/shrink-images.mjs ../kawabata-data/images
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const dir = process.argv[2];
const MAX_W = 1400; // 横幅の上限（スマホ・パソコンの記事幅に十分）
const QUALITY = 72;
const logPath = path.join(dir, ".optimized.json");
const done = new Set(fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, "utf8")) : []);

const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(webp|jpe?g|png)$/i.test(f)) files.push(p);
  }
})(dir);

let saved = 0;
for (const p of files) {
  const key = path.relative(dir, p);
  if (done.has(key)) continue;
  const before = fs.statSync(p).size;
  try {
    const img = sharp(p, { failOn: "none" }).rotate();
    const meta = await img.metadata();
    const out = await img
      .resize({ width: Math.min(MAX_W, meta.width || MAX_W), withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer();
    // 小さくなったときだけ置き換える（ファイル名と形式はそのまま。拡張子が webp 以外なら置き換えない）
    if (out.length < before && /\.webp$/i.test(p)) {
      fs.writeFileSync(p, out);
      saved += before - out.length;
      console.log(`写真を小さくしました: ${key} ${Math.round(before / 1024)}KB → ${Math.round(out.length / 1024)}KB`);
    }
    done.add(key);
  } catch (e) {
    console.log(`::warning::写真を小さくできませんでした: ${key} ${e.message}`);
  }
}
fs.writeFileSync(logPath, JSON.stringify([...done].sort(), null, 2) + "\n");
console.log(`合計 ${Math.round(saved / 1024)}KB 軽くなりました`);
