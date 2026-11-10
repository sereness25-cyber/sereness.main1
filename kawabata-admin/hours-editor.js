/*
 * かわばた日和：営業時間・臨時変更の入力欄（編集部の管理ページと、お店用のページで共通）
 *   const w = HoursEditor.weekly(el, shop.hours, onChange);   w.get() → hours（未登録なら null）
 *   const s = HoursEditor.specials(el, shop.specials, onChange); s.get() → specials
 *   HoursEditor.preview(el, () => ({ hours, specials }))        いまの公開ページでの表示
 * 営業判定そのものは ../kawabata/js/kawabata-hours.js（公開ページと同じもの）
 */
(function () {
  "use strict";
  var DAYS = [[1, "月"], [2, "火"], [3, "水"], [4, "木"], [5, "金"], [6, "土"], [0, "日"]];
  var esc = function (v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var clone = function (x) { return JSON.parse(JSON.stringify(x == null ? null : x)); };
  /* "25:00" のような書き方は、入力欄では "01:00" にする（翌日扱いは自動） */
  var norm = function (t) { var m = /^(\d{1,2}):(\d{2})$/.exec(String(t || "")); if (!m) return ""; var h = +m[1] % 24; return (h < 10 ? "0" : "") + h + ":" + m[2]; };
  var nextDay = function (o, c) { return o && c && c <= o; };

  var CSS = "" +
    ".he-day{display:grid;grid-template-columns:2.4em 1fr;gap:8px;padding:10px 0;border-top:1px solid #f1ebe3;align-items:start}" +
    ".he-day:first-child{border-top:0}.he-day b{padding-top:8px;color:#34445c}" +
    ".he-ranges{display:flex;flex-direction:column;gap:6px}.he-range{display:flex;flex-wrap:wrap;align-items:center;gap:6px}" +
    ".he-range input[type=time]{width:auto;min-width:7.2em;padding:7px 8px}.he-next{font-size:.75rem;color:#8a5a00;font-weight:700}" +
    ".he-mini{min-height:32px;padding:0 10px;border:1px solid #d9cfc2;border-radius:999px;background:#fff;color:#34445c;font-size:.78rem;cursor:pointer}" +
    ".he-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.he-nth{display:flex;flex-wrap:wrap;gap:8px;font-size:.78rem;color:#555}" +
    ".he-nth label{display:inline-flex;gap:3px;align-items:center}.he-off .he-ranges,.he-off .he-nthbox{opacity:.35;pointer-events:none}" +
    ".he-sp{display:grid;gap:8px;padding:12px;border:1px solid #e6ded3;border-radius:12px;background:#fbf9f6}" +
    ".he-sp + .he-sp{margin-top:10px}.he-sp input[type=date]{width:auto}.he-sp select{width:auto}" +
    ".he-preview{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 14px;border-radius:12px;background:#faf8f5;font-size:.9rem}" +
    ".he-preview b{color:#34445c}";
  if (!document.getElementById("he-css")) { var st = document.createElement("style"); st.id = "he-css"; st.textContent = CSS; document.head.appendChild(st); }

  function rangeHtml(r, i) {
    return '<div class="he-range" data-i="' + i + '"><input type="time" step="300" data-open value="' + esc(norm(r.open)) + '" aria-label="開店">〜' +
      '<input type="time" step="300" data-close value="' + esc(norm(r.close)) + '" aria-label="閉店">' +
      '<span class="he-next"' + (nextDay(norm(r.open), norm(r.close)) ? "" : " hidden") + '>翌日</span>' +
      '<button type="button" class="he-mini" data-rm-range aria-label="この時間帯を消す">×</button></div>';
  }
  function readRanges(box) {
    return Array.prototype.map.call(box.querySelectorAll(".he-range"), function (row) {
      return { open: row.querySelector("[data-open]").value, close: row.querySelector("[data-close]").value };
    }).filter(function (r) { return r.open && r.close && r.open !== r.close; });
  }
  function bindRanges(box, onChange) {
    box.addEventListener("input", function (e) {
      var row = e.target.closest(".he-range");
      if (row) row.querySelector(".he-next").hidden = !nextDay(row.querySelector("[data-open]").value, row.querySelector("[data-close]").value);
      onChange();
    });
  }

  /* ---------- 通常の営業時間 ---------- */
  function weekly(el, hours, onChange) {
    onChange = onChange || function () {};
    var h = clone(hours);
    var on = !!h;
    el.innerHTML =
      '<label class="check"><input type="checkbox" data-on ' + (on ? "checked" : "") + '><span><b>営業時間を登録する</b>（登録すると「本日営業のお店」に出ます）</span></label>' +
      '<div data-body ' + (on ? "" : "hidden") + '>' +
      '<p class="hint" style="margin:6px 0 4px">閉店の時刻が開店より早ければ「翌日」として扱います（例：19:00〜03:00 は翌3時まで）。1日に2つの時間帯（昼と夜など）も登録できます。</p>' +
      DAYS.map(function (d) {
        var w = (h && (h[d[0]] || h[String(d[0])])) || { closed: false, ranges: [{ open: "19:00", close: "01:00" }] };
        var ranges = w.ranges && w.ranges.length ? w.ranges : [{ open: "19:00", close: "01:00" }];
        var nth = w.closed_nth || [];
        return '<div class="he-day' + (w.closed ? " he-off" : "") + '" data-day="' + d[0] + '"><b>' + d[1] + '</b><div>' +
          '<div class="he-row"><label class="check" style="margin:0"><input type="checkbox" data-closed ' + (w.closed ? "checked" : "") + '><span>定休日</span></label>' +
          (d[0] === 1 ? '<button type="button" class="he-mini" data-copy>この時間をほかの曜日にもコピー</button>' : "") + "</div>" +
          '<div class="he-ranges" style="margin-top:6px">' + ranges.map(rangeHtml).join("") + "</div>" +
          '<div class="he-row" style="margin-top:6px"><button type="button" class="he-mini" data-add-range>＋ 時間帯を追加</button></div>' +
          '<details class="he-nthbox" style="margin-top:6px"' + (nth.length ? " open" : "") + '><summary class="hint" style="cursor:pointer">毎月決まった週だけ休み（例：第1・第3月曜）</summary><div class="he-nth">' +
          [1, 2, 3, 4, 5].map(function (n) { return '<label><input type="checkbox" data-nth="' + n + '" ' + (nth.indexOf(n) >= 0 ? "checked" : "") + ">第" + n + "</label>"; }).join("") +
          "</div></details></div></div>";
      }).join("") + "</div>";
    var body = el.querySelector("[data-body]");
    el.querySelector("[data-on]").addEventListener("change", function (e) { body.hidden = !e.target.checked; onChange(); });
    body.addEventListener("change", function (e) {
      if (e.target.matches("[data-closed]")) e.target.closest(".he-day").classList.toggle("he-off", e.target.checked);
      onChange();
    });
    bindRanges(body, onChange);
    body.addEventListener("click", function (e) {
      var day = e.target.closest(".he-day");
      if (e.target.matches("[data-add-range]")) {
        var box = day.querySelector(".he-ranges");
        if (box.children.length >= 3) return;
        box.insertAdjacentHTML("beforeend", rangeHtml({ open: "11:30", close: "14:00" }, box.children.length));
        onChange();
      } else if (e.target.matches("[data-rm-range]")) {
        var b = day.querySelector(".he-ranges");
        if (b.children.length > 1) e.target.closest(".he-range").remove(); else day.querySelector("[data-closed]").click();
        onChange();
      } else if (e.target.matches("[data-copy]")) {
        var src = day.querySelector(".he-ranges").innerHTML;
        body.querySelectorAll(".he-day").forEach(function (d) { if (d !== day && !d.querySelector("[data-closed]").checked) d.querySelector(".he-ranges").innerHTML = src; });
        Array.prototype.forEach.call(day.querySelectorAll("input[type=time]"), function (inp, i) {
          body.querySelectorAll(".he-day").forEach(function (d) { if (d !== day && !d.querySelector("[data-closed]").checked) { var x = d.querySelectorAll("input[type=time]")[i]; if (x) x.value = inp.value; } });
        });
        onChange();
      }
    });
    return {
      get: function () {
        if (!el.querySelector("[data-on]").checked) return null;
        var out = {};
        body.querySelectorAll(".he-day").forEach(function (d) {
          var ranges = readRanges(d);
          var closed = d.querySelector("[data-closed]").checked || !ranges.length;
          var nth = Array.prototype.filter.call(d.querySelectorAll("[data-nth]"), function (x) { return x.checked; }).map(function (x) { return +x.getAttribute("data-nth"); });
          out[d.getAttribute("data-day")] = closed ? { closed: true, ranges: [] } : nth.length ? { closed: false, ranges: ranges, closed_nth: nth } : { closed: false, ranges: ranges };
        });
        return out;
      },
    };
  }

  /* ---------- 臨時休業・臨時営業・時間変更 ---------- */
  function specials(el, list, onChange) {
    onChange = onChange || function () {};
    var today = window.KawabataHours ? window.KawabataHours.businessDate() : new Date().toISOString().slice(0, 10);
    function itemHtml(x) {
      var r = (x.ranges && x.ranges[0]) || { open: "19:00", close: "01:00" };
      return '<div class="he-sp"><div class="he-row"><input type="date" data-date value="' + esc(x.date) + '" min="' + today + '" aria-label="日付">' +
        '<select data-kind aria-label="内容"><option value="closed"' + (x.closed ? " selected" : "") + '>臨時休業</option><option value="open"' + (x.closed ? "" : " selected") + ">営業時間を変える（臨時営業・早じまいなど）</option></select>" +
        '<button type="button" class="he-mini" data-rm-sp>削除</button></div>' +
        '<div class="he-ranges" data-sp-ranges' + (x.closed ? " hidden" : "") + ">" + rangeHtml(r, 0) + "</div>" +
        '<input type="text" data-note maxlength="60" placeholder="ひとこと（任意。例：貸切のため、イベント開催）" value="' + esc(x.note || "") + '"></div>';
    }
    var items = (list || []).filter(function (x) { return x && x.date >= today; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    el.innerHTML = '<div data-list>' + items.map(itemHtml).join("") + "</div>" +
      '<p class="hint" data-empty' + (items.length ? " hidden" : "") + ">登録されている臨時の変更はありません。</p>" +
      '<button type="button" class="btn small" data-add-sp style="margin-top:10px">＋ 臨時休業・臨時営業を追加</button>';
    var box = el.querySelector("[data-list]");
    bindRanges(box, onChange);
    box.addEventListener("change", function (e) {
      if (e.target.matches("[data-kind]")) e.target.closest(".he-sp").querySelector("[data-sp-ranges]").hidden = e.target.value === "closed";
      onChange();
    });
    el.addEventListener("click", function (e) {
      if (e.target.matches("[data-add-sp]")) { add({ date: today, closed: true, note: "" }); }
      else if (e.target.matches("[data-rm-sp]")) { e.target.closest(".he-sp").remove(); el.querySelector("[data-empty]").hidden = !!box.children.length; onChange(); }
    });
    function add(x) {
      box.insertAdjacentHTML("beforeend", itemHtml(x));
      el.querySelector("[data-empty]").hidden = true;
      onChange();
    }
    return {
      get: function () {
        var seen = {};
        return Array.prototype.map.call(box.querySelectorAll(".he-sp"), function (row) {
          var date = row.querySelector("[data-date]").value, note = row.querySelector("[data-note]").value.trim();
          if (!date) return null;
          if (row.querySelector("[data-kind]").value === "closed") return { date: date, closed: true, note: note };
          var rs = readRanges(row);
          return rs.length ? { date: date, closed: false, ranges: rs, note: note } : null;
        }).filter(function (x) { if (!x || seen[x.date]) return false; seen[x.date] = true; return true; })
          .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      },
      add: add,
    };
  }

  /* ---------- いまの表示 ---------- */
  function preview(el, read) {
    function draw() {
      var H = window.KawabataHours;
      if (!H) { el.innerHTML = ""; return; }
      var st = H.status(read());
      el.innerHTML = '<div class="he-preview"><span>いまの公開ページでの表示：</span>' +
        (st ? "<b>" + st.icon + " " + esc(st.label) + "</b>" + (st.state === "temp_closed" || st.state === "closed_day" ? "" : "<span>" + esc(st.hoursText) + "</span>") : "<b>営業時間が未登録のため、表示されません</b>") + "</div>";
    }
    draw();
    setInterval(draw, 60000);
    return draw;
  }

  window.HoursEditor = { weekly: weekly, specials: specials, preview: preview, norm: norm };
})();
