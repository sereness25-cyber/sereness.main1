// supabase/setup-all.sql を作る（Supabase の SQL Editor に一度貼って実行するだけで準備が終わる）
//   npm run setup:sql
import { readFileSync, writeFileSync } from "node:fs";
const r = (p) => readFileSync(new URL(`../supabase/${p}`, import.meta.url), "utf8");
const out = [
  "-- かわばた日和: データベースの一括セットアップ",
  "-- Supabase の SQL Editor に全部貼り付けて「Run」を押してください。",
  "-- このファイルは scripts/build-setup-sql.mjs で生成しています。",
  "",
  r("migrations/0001_init.sql"),
  r("migrations/0002_shop_sources.sql"),
  r("seed.sql"),
].join("\n");
writeFileSync(new URL("../supabase/setup-all.sql", import.meta.url), out);
console.log("supabase/setup-all.sql を作りました");
