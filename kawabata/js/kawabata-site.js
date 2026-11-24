/*
 * かわばた日和：静的ページ（GitHub Pages）で、検索・絞り込み・お問い合わせを動かす
 * 書き出し（scripts/export_static.py）で、該当するページにだけ入る。
 *   - お店を探す（data-kb-filter="shops"）、記事一覧（"articles"）、サイト内検索（"search"）
 *     → ページには全部のお店・記事が入っていて、条件に合わないものを隠す。条件は URL（?category=bar など）にも残す
 *   - お問い合わせ（data-kb-contact）→ Apps Script に送る
 */
(function () {
  "use strict";
  var norm = function (s) { return String(s == null ? "" : s).normalize("NFKC").toLowerCase(); };
  var words = function (q) { return norm(q).split(/\s+/).filter(Boolean); };
  var hasAll = function (text, ws) { for (var i = 0; i < ws.length; i++) if (text.indexOf(ws[i]) < 0) return false; return true; };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };

  /* フォームと URL のやりとり */
  function setForm(form, p) {
    $$("input[name],select[name],textarea[name]", form).forEach(function (el) {
      var v = p.get(el.name);
      if (el.type === "checkbox") el.checked = v !== null && v === el.value;
      else if (v !== null) el.value = v;
    });
  }
  function readForm(form) {
    var p = new URLSearchParams();
    $$("input[name],select[name],textarea[name]", form).forEach(function (el) {
      if (el.type === "checkbox") { if (el.checked) p.set(el.name, el.value); }
      else if (el.value && !(el.name === "sort" && el.value === "new")) p.set(el.name, el.value);
    });
    return p;
  }
  function bindFilter(form, apply) {
    var p0 = new URLSearchParams(location.search);
    setForm(form, p0);
    apply(p0);
    var run = function () {
      var p = readForm(form);
      var qs = p.toString();
      history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
      apply(p);
    };
    form.addEventListener("submit", function (e) { e.preventDefault(); run(); });
    // 選んだらすぐ反映（キーワードは「探す」ボタンか Enter で）
    form.addEventListener("change", function (e) { if (e.target.type !== "search" && e.target.type !== "text") run(); });
  }
  function setCount(root, n, q) {
    var c = root.querySelector("[data-kb-count]");
    if (c) c.textContent = c.getAttribute("data-kb-count").replace("{n}", n).replace("{q}", q || "");
    var empty = root.querySelector("[data-kb-empty]");
    if (empty) empty.hidden = n > 0;
    var list = root.querySelector("[data-kb-list]");
    if (list) list.hidden = n === 0;
  }

  /* お店を探す */
  function shops(form) {
    var root = form.parentElement, items = $$("[data-kb-item]", root);
    bindFilter(form, function (p) {
      var ws = words(p.get("q")), cat = p.get("category") || "", budget = Number(p.get("budget")) || 0, n = 0;
      items.forEach(function (el) {
        var d = el.dataset;
        var ok = hasAll(d.text || "", ws) &&
          (!cat || d.category === cat) &&
          (!budget || (d.budget !== "" && Number(d.budget) <= budget)) &&
          (p.get("beginner") !== "1" || d.beginner === "1") &&
          (p.get("solo") !== "1" || d.solo === "1") &&
          (p.get("nonalc") !== "1" || d.nonalc === "1");
        el.hidden = !ok;
        if (ok) n++;
      });
      setCount(root, n);
    });
  }

  /* 記事一覧（絞り込み＋並べ替え） */
  function articles(form) {
    var root = form.parentElement, list = root.querySelector("[data-kb-list]"), items = $$("[data-kb-item]", root);
    bindFilter(form, function (p) {
      var ws = words(p.get("q")), cat = p.get("category") || "", tag = p.get("tag") || "";
      var from = p.get("from") || "", to = p.get("to") || "", sort = p.get("sort") || "new", n = 0;
      items.forEach(function (el) {
        var d = el.dataset, date = d.date || "";
        var ok = hasAll(d.text || "", ws) &&
          (!cat || (" " + d.categories + " ").indexOf(" " + cat + " ") >= 0) &&
          (!tag || (" " + d.tags + " ").indexOf(" " + tag + " ") >= 0) &&
          (!from || date >= from) &&
          (!to || date <= to + "T23:59:59+09:00");
        el.hidden = !ok;
        if (ok) n++;
      });
      var sorted = items.slice().sort(function (a, b) {
        var da = a.dataset.date || "", db = b.dataset.date || "";
        if (sort === "old") return da.localeCompare(db);
        if (sort === "recommended") return Number(b.dataset.featured === "1") - Number(a.dataset.featured === "1") || db.localeCompare(da);
        return db.localeCompare(da);
      });
      sorted.forEach(function (el) { list.appendChild(el); });
      setCount(root, n);
    });
  }

  /* サイト内検索 */
  function search(form) {
    var root = form.parentElement, sections = $$("[data-kb-section]", root);
    bindFilter(form, function (p) {
      var q = (p.get("q") || "").trim(), ws = words(q), scope = p.get("scope") || "", total = 0;
      sections.forEach(function (sec) {
        var n = 0;
        $$("[data-kb-item]", sec).forEach(function (el) {
          var ok = ws.length > 0 && hasAll(el.dataset.text || "", ws);
          el.hidden = !ok;
          if (ok) n++;
        });
        if (scope && sec.getAttribute("data-kb-section") !== scope) n = 0;
        sec.hidden = n === 0;
        var h = sec.querySelector("[data-kb-heading]");
        if (h) h.textContent = h.getAttribute("data-kb-heading").replace("{n}", n);
        total += n;
      });
      var c = root.querySelector("[data-kb-count]"), empty = root.querySelector("[data-kb-empty]");
      if (c) { c.hidden = !q; c.textContent = c.getAttribute("data-kb-count").replace("{q}", q).replace("{n}", total); }
      if (empty) empty.hidden = !q || total > 0;
    });
  }

  /* お問い合わせ */
  function contact(form) {
    var api = form.getAttribute("data-api"), msg = form.querySelector("[data-kb-msg]"), btn = form.querySelector("button[type=submit]");
    var show = function (k, text) { var el = form.querySelector('[data-kb-err="' + k + '"]'); if (el) { el.textContent = text || ""; el.hidden = !text; } };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = function (n) { var el = form.elements[n]; return el ? (el.type === "checkbox" ? el.checked : String(el.value || "").trim()) : ""; };
      var errs = {
        name: f("name") ? "" : "お名前を入力してください。",
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f("email")) ? "" : "メールアドレスを正しく入力してください。",
        body: f("body") ? "" : "お問い合わせ内容を入力してください。",
        agree: f("agree") ? "" : "プライバシーポリシーへの同意が必要です。",
      };
      var bad = false;
      Object.keys(errs).forEach(function (k) { show(k, errs[k]); if (errs[k]) bad = true; });
      msg.hidden = true;
      if (bad) return;
      btn.disabled = true; btn.textContent = "送信しています…";
      fetch(api, {
        method: "POST", redirect: "follow", headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "contact", name: f("name"), email: f("email"), subject: f("subject"), body: f("body"), website: f("website"), page: location.href }),
      })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j || !j.ok) throw new Error((j && j.error) || "");
          form.hidden = true;
          var done = form.parentElement.querySelector("[data-kb-done]");
          if (done) { done.hidden = false; done.scrollIntoView({ block: "center" }); }
        })
        .catch(function (err) {
          msg.textContent = "送信できませんでした。" + (err && err.message ? "（" + err.message + "）" : "") + "時間をおいてもう一度お試しください。";
          msg.hidden = false;
          btn.disabled = false; btn.textContent = "送信する";
        });
    });
  }

  $$('[data-kb-filter="shops"]').forEach(shops);
  $$('[data-kb-filter="articles"]').forEach(articles);
  $$('[data-kb-filter="search"]').forEach(search);
  $$("[data-kb-contact]").forEach(contact);
})();
