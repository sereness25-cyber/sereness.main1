// 営業判定のテスト：node scripts/test-hours.mjs
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const H = require("../public/js/kawabata-hours.js");

let fail = 0;
const at = (s) => new Date(s + "+09:00"); // 日本時間で指定
function eq(name, got, want) {
  const ok = got === want;
  if (!ok) fail++;
  console.log(`${ok ? "OK " : "NG "} ${name}: ${got}${ok ? "" : ` （期待：${want}）`}`);
}
const st = (shop, t) => { const s = H.status(shop, at(t)); return s ? s.label : "対象外"; };
const every = (r) => Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [String(d), r]));

// 5-3：19:00〜翌3:00（毎日）。2026-11-13 は金曜日
const late = { hours: every({ closed: false, ranges: [{ open: "19:00", close: "03:00" }] }) };
eq("18:00", st(late, "2026-11-13T18:00"), "営業予定");
eq("19:00", st(late, "2026-11-13T19:00"), "営業中");
eq("23:00", st(late, "2026-11-13T23:00"), "営業中");
eq("翌1:00", st(late, "2026-11-14T01:00"), "営業中");
eq("翌2:59", st(late, "2026-11-14T02:59"), "営業中");
eq("翌3:00", st(late, "2026-11-14T03:00"), "営業終了");
eq("時間の表示", H.status(late, at("2026-11-14T01:00")).hoursText, "19:00〜翌3:00");

// 5-4：金曜だけ 19:00〜翌3:00、土曜は定休 → 土曜1時は金曜の営業として「営業中」
const fri = { hours: { ...every({ closed: true, ranges: [] }), 5: { closed: false, ranges: [{ open: "19:00", close: "03:00" }] } } };
eq("土曜1時（金曜の続き）", st(fri, "2026-11-14T01:00"), "営業中");
eq("土曜3時半（金曜の営業が終わった後）", st(fri, "2026-11-14T03:30"), "営業終了");
eq("土曜6時（土曜は定休日）", st(fri, "2026-11-14T06:00"), "本日休業");
eq("朝5時をこえて続く営業", st({ hours: every({ closed: false, ranges: [{ open: "20:00", close: "06:00" }] }) }, "2026-11-14T05:30"), "営業中");

// "25:00" の書き方（お店の営業スケジュールと同じ形）
const s25 = { hours: every({ closed: false, ranges: [{ open: "19:00", close: "25:00" }] }) };
eq("25:00表記・翌0:30", st(s25, "2026-11-14T00:30"), "営業中");
eq("25:00表記・翌1:00", st(s25, "2026-11-14T01:00"), "営業終了");

// 6-3：臨時休業 ＞ 特別営業時間 ＞ 通常 ＞ 定休日
const base = { hours: { ...every({ closed: false, ranges: [{ open: "18:00", close: "23:00" }] }), 3: { closed: true, ranges: [] } } };
eq("通常の営業日", st(base, "2026-11-13T20:00"), "営業中");
eq("定休日（水曜）", st(base, "2026-11-11T20:00"), "本日休業");
eq("臨時休業", st({ ...base, specials: [{ date: "2026-11-13", closed: true }] }, "2026-11-13T20:00"), "臨時休業");
eq("定休日に臨時営業", st({ ...base, specials: [{ date: "2026-11-11", closed: false, ranges: [{ open: "19:00", close: "22:00" }] }] }, "2026-11-11T20:00"), "営業中");
eq("早じまい（21時まで）", st({ ...base, specials: [{ date: "2026-11-13", closed: false, ranges: [{ open: "18:00", close: "21:00" }] }] }, "2026-11-13T21:30"), "営業終了");
eq("開店を遅らせる", st({ ...base, specials: [{ date: "2026-11-13", closed: false, ranges: [{ open: "20:00", close: "23:00" }] }] }, "2026-11-13T19:00"), "営業予定");
eq("前日の深夜営業は、今日が臨時休業でも続く", st({ ...late, specials: [{ date: "2026-11-14", closed: true }] }, "2026-11-14T01:00"), "営業中");
eq("臨時休業の日の夜", st({ ...late, specials: [{ date: "2026-11-14", closed: true }] }, "2026-11-14T20:00"), "臨時休業");

// 1日に2つの時間帯（ランチと夜）
const two = { hours: every({ closed: false, ranges: [{ open: "11:30", close: "14:00" }, { open: "17:00", close: "23:00" }] }) };
eq("昼の営業中", st(two, "2026-11-13T12:00"), "営業中");
eq("昼と夜のあいだ", st(two, "2026-11-13T15:00"), "営業予定");
eq("2つの時間帯の表示", H.status(two, at("2026-11-13T15:00")).hoursText, "11:30〜14:00、17:00〜23:00");

// 第1・第3月曜休み（2026-11-02 第1月曜、11-09 第2月曜、11-16 第3月曜）
const nth = { hours: every({ closed: false, ranges: [{ open: "18:00", close: "01:00" }] }) };
nth.hours[1] = { closed: false, ranges: [{ open: "18:00", close: "01:00" }], closed_nth: [1, 3] };
eq("第1月曜は休み", st(nth, "2026-11-02T20:00"), "本日休業");
eq("第2月曜は営業", st(nth, "2026-11-09T20:00"), "営業中");
eq("第3月曜は休み", st(nth, "2026-11-16T20:00"), "本日休業");

// 24時閉店の表示
eq("24:00の表示", H.status({ hours: every({ closed: false, ranges: [{ open: "17:00", close: "24:00" }] }) }, at("2026-11-13T20:00")).hoursText, "17:00〜24:00");

// 未登録
eq("営業時間が未登録", st({ hours: null }, "2026-11-13T20:00"), "対象外");

// 日本時間で判定する（UTCでは前日でも、日本では金曜20時）
eq("日本時間", H.status(late, new Date("2026-11-13T11:00:00Z")).label, "営業中");
eq("店舗ページの「今日」は0〜5時なら前日", H.businessDate(at("2026-11-14T02:00")), "2026-11-13");

console.log(fail ? `\n${fail}件 失敗` : "\nすべて成功");
process.exit(fail ? 1 : 0);
