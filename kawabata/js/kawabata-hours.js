/*
 * かわばた日和：営業状態の判定（公開ページ・管理ページ・店舗ページで共通）
 *
 * 営業時間のデータ
 *   shop.hours    = { "0": 日曜, "1": 月曜, … "6": 土曜 }  （未登録なら null → 自動判定しない）
 *                   各曜日 = { closed: 定休日か, ranges: [{ open: "19:00", close: "03:00" }], closed_nth: [1, 3] }
 *                   閉店が開店と同じか早い時刻なら翌日に閉店（例 19:00〜03:00）。"25:00" のような書き方も可
 *                   closed_nth は「第1・第3月曜は休み」のような、その月の何回目の曜日だけ休む指定
 *   shop.specials = [{ date: "2026-11-10", closed: true, note: "" }]               臨時休業
 *                   [{ date: "2026-11-10", closed: false, ranges: [...], note: "" }] 臨時営業・時間変更・早じまい
 *                   date は「営業日」。深夜0時をまたぐ営業も、始まった日の扱い
 *
 * 優先順位：臨時休業 ＞ その日の特別営業時間 ＞ 通常の営業時間 ＞ 定休日
 * 判定は日本時間（UTC+9。日本には夏時間がないので固定）。朝5時を営業日の区切りとする
 */
(function (root) {
  "use strict";
  var DAY = 1440;
  var CUTOFF = 5 * 60; // 営業日の区切り（朝5時）
  var JST = 9 * 60 * 60 * 1000;

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function toMin(t) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(t || ""));
    if (!m) return null;
    var h = +m[1], mi = +m[2];
    if (h > 47 || mi > 59) return null;
    return h * 60 + mi;
  }

  /* 日本時間での「日付」と「その日の0時からの分」 */
  function jstNow(date) {
    var d = new Date((date ? date.getTime() : Date.now()) + JST);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), wd: d.getUTCDay(), min: d.getUTCHours() * 60 + d.getUTCMinutes() };
  }
  function shiftDay(day, n) {
    var d = new Date(Date.UTC(day.y, day.m - 1, day.d + n));
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), wd: d.getUTCDay() };
  }
  function dateKey(day) { return day.y + "-" + pad(day.m) + "-" + pad(day.d); }

  /* 1つの時間帯を、その営業日の0時からの分に直す（翌日にまたがれば end は 1440 を超える） */
  function span(r) {
    var s = toMin(r && r.open), e = toMin(r && r.close);
    if (s === null || e === null) return null;
    if (s >= DAY) s -= DAY;
    if (e <= s) e += DAY;
    if (e - s > DAY) return null;
    return { start: s, end: e, open: r.open, close: r.close };
  }

  function hasHours(shop) {
    if (!shop || !shop.hours || typeof shop.hours !== "object") return false;
    for (var k = 0; k < 7; k++) if (shop.hours[k] || shop.hours[String(k)]) return true;
    return false;
  }

  /* ある営業日の営業時間帯。reason: "temp"＝臨時休業、"regular"＝定休日 */
  function rangesFor(shop, day) {
    var key = dateKey(day), sp = null, list = shop.specials || [];
    for (var i = 0; i < list.length; i++) if (list[i] && list[i].date === key) { sp = list[i]; break; }
    if (sp) {
      if (sp.closed) return { ranges: [], reason: "temp", special: sp };
      return { ranges: (sp.ranges || []).map(span).filter(Boolean), reason: null, special: sp };
    }
    var w = shop.hours[day.wd] || shop.hours[String(day.wd)];
    var nth = Math.floor((day.d - 1) / 7) + 1;
    if (!w || w.closed || (w.closed_nth || []).indexOf(nth) >= 0) return { ranges: [], reason: "regular", special: null };
    var rs = (w.ranges || []).map(span).filter(Boolean);
    return { ranges: rs, reason: rs.length ? null : "regular", special: null };
  }

  /* "19:00〜翌3:00" */
  function rangeText(r) {
    if (!r) return "";
    var e = r.end;
    var close = e > DAY ? "翌" + Math.floor((e - DAY) / 60) + ":" + pad((e - DAY) % 60) : Math.floor(e / 60) + ":" + pad(e % 60);
    return Math.floor(r.start / 60) + ":" + pad(r.start % 60) + "〜" + close;
  }

  var LABELS = {
    open: { icon: "🟢", text: "営業中", rank: 0 },
    soon: { icon: "🕒", text: "営業予定", rank: 1 },
    ended: { icon: "⚪", text: "営業終了", rank: 2 },
    closed_day: { icon: "🔴", text: "本日休業", rank: 3 },
    temp_closed: { icon: "🔴", text: "臨時休業", rank: 3 },
  };

  /*
   * 営業状態を返す。営業時間が未登録なら null。
   * { state, icon, label, rank, range, hoursText, lateNight, note }
   */
  function status(shop, date) {
    if (!hasHours(shop)) return null;
    // 夜の街なので、0時〜5時は「前日の夜の続き」として判定する（翌3時閉店の店が、3時に「営業終了」になるように）
    var now = jstNow(date);
    var biz = now.min < CUTOFF ? shiftDay(now, -1) : now;
    var m = now.min < CUTOFF ? now.min + DAY : now.min;
    var y = rangesFor(shop, shiftDay(biz, -1)), t = rangesFor(shop, biz);
    var i, r, res = null;
    // 前の営業日から続いている営業（朝5時をこえて続く店など）
    for (i = 0; i < y.ranges.length && !res; i++) {
      r = y.ranges[i];
      if (m + DAY >= r.start && m + DAY < r.end) res = make("open", r, y);
    }
    for (i = 0; i < t.ranges.length && !res; i++) {
      r = t.ranges[i];
      if (m >= r.start && m < r.end) res = make("open", r, t);
    }
    if (!res) {
      var next = null;
      for (i = 0; i < t.ranges.length; i++) if (t.ranges[i].start > m && (!next || t.ranges[i].start < next.start)) next = t.ranges[i];
      if (next) res = make("soon", next, t);
      else if (t.reason === "temp") res = make("temp_closed", null, t);
      else if (t.reason === "regular") res = make("closed_day", null, t);
      else res = make("ended", t.ranges[t.ranges.length - 1] || null, t);
    }
    return res;

    function make(state, range, info) {
      var L = LABELS[state];
      var all = info.ranges.map(rangeText).join("、");
      return {
        state: state, icon: L.icon, label: L.text, rank: L.rank, range: range,
        hoursText: state === "temp_closed" ? "臨時休業" : state === "closed_day" ? "定休日" : all,
        lateNight: info.ranges.some(function (x) { return x.end > DAY; }),
        note: info.special && info.special.note ? String(info.special.note) : "",
      };
    }
  }

  /* いまの営業日（0時〜5時は前日）。店舗ページの「今日」もこれ */
  function businessDate(date) {
    var now = jstNow(date);
    return dateKey(now.min < CUTOFF ? shiftDay(now, -1) : now);
  }

  var api = { status: status, hasHours: hasHours, rangeText: rangeText, toMin: toMin, businessDate: businessDate, jstNow: jstNow, dateKey: dateKey, shiftDay: shiftDay, span: span, LABELS: LABELS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KawabataHours = api;
})(typeof window !== "undefined" ? window : globalThis);
