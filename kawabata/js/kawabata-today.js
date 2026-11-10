/*
 * かわばた日和：本日営業のお店（トップページのカルーセルと、/shops/today の一覧）
 * kawabata-hours.js の後に読み込む。書き出し（scripts/export_static.py）で必要なページにだけ入る。
 *
 * - 営業状態は日本時間で1分ごと・画面に戻ったときに判定し直す
 * - 最新の営業時間（お店の臨時休業など）は Apps Script から5分ごとに取り直す
 * - 並び順：営業中 → 営業予定。同じ状態の中はランダム（ページを開いたときに決め、見ている間は変えない）
 */
(function () {
  "use strict";
  var H = window.KawabataHours;
  if (!H) return;
  var script = document.currentScript || document.querySelector('script[src*="kawabata-today.js"]');
  var ROOT = new URL("../", script.src).href; // サイトのいちばん上
  var REFRESH_MS = 5 * 60 * 1000;

  var esc = function (v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var link = function (slug) { return ROOT + "shops/" + encodeURIComponent(slug) + ".html"; };
  var img = function (src) { return /^https?:\/\//.test(src) ? src : ROOT + String(src || "").replace(/^\//, ""); };
  var STATE_CLASS = { open: "open", soon: "soon", ended: "ended", closed_day: "closed", temp_closed: "closed" };
  var badge = function (st) { return '<span class="kb-badge kb-badge--' + STATE_CLASS[st.state] + '">' + st.icon + " " + st.label + "</span>"; };
  var hoursLine = function (st) {
    if (st.state === "temp_closed") return "本日は臨時休業です" + (st.note ? "（" + esc(st.note) + "）" : "");
    if (st.state === "closed_day") return "本日は定休日です";
    return "本日 " + esc(st.hoursText) + (st.note ? "<br><span class=\"kb-note\">" + esc(st.note) + "</span>" : "");
  };

  /* ---------- データ ---------- */
  function readShops(el) {
    try { return JSON.parse(el.getAttribute("data-shops") || "[]"); } catch (e) { return []; }
  }
  var order = {}; // ページを開いたときに決める、お店ごとのランダムな順番
  function rnd(slug) { if (!(slug in order)) order[slug] = Math.random(); return order[slug]; }
  function evaluate(shops) {
    var now = new Date();
    return shops.map(function (s) { return { shop: s, st: H.status(s, now) }; })
      .filter(function (x) { return x.st; })
      .sort(function (a, b) { return a.st.rank - b.st.rank || rnd(a.shop.slug) - rnd(b.shop.slug); });
  }

  /* 最新の営業時間を取り直す（失敗したらページに入っているデータのまま） */
  function refresher(api, shops, onUpdate) {
    var last = 0;
    function pull() {
      if (!api || document.hidden || Date.now() - last < REFRESH_MS - 1000) return;
      last = Date.now();
      fetch(api + (api.indexOf("?") < 0 ? "?" : "&") + "kawabata=today&t=" + Date.now(), { cache: "no-store" })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j || j.kb !== 1 || !Array.isArray(j.shops)) return;
          var by = {};
          j.shops.forEach(function (x) { if (x && x.slug) by[x.slug] = x; });
          shops.forEach(function (s) { var x = by[s.slug]; if (x) { s.hours = x.hours; s.specials = x.specials || []; } });
          onUpdate();
        })
        .catch(function () {});
    }
    pull();
    setInterval(pull, REFRESH_MS);
    document.addEventListener("visibilitychange", pull);
  }

  /* ---------- カード ---------- */
  function card(x, extra) {
    var s = x.shop;
    return '<a class="kb-card' + (extra || "") + '" href="' + link(s.slug) + '">' +
      '<span class="kb-card-photo"><img src="' + esc(img(s.img)) + '" alt="" loading="lazy" decoding="async">' + badge(x.st) + "</span>" +
      '<span class="kb-card-body"><span class="kb-card-cat">' + esc(s.cat) + "</span>" +
      '<span class="kb-card-name">' + esc(s.name) + "</span>" +
      '<span class="kb-card-hours">' + hoursLine(x.st) + "</span></span></a>";
  }

  /* ---------- トップページのカルーセル ---------- */
  function carousel(root) {
    var shops = readShops(root);
    var track = root.querySelector("[data-track]"), dots = root.querySelector("[data-dots]");
    var prev = root.querySelector("[data-prev]"), next = root.querySelector("[data-next]");
    var signature = "", busyUntil = 0, pending = false;

    function render(force) {
      var list = evaluate(shops).filter(function (x) { return x.st.state === "open" || x.st.state === "soon"; });
      var sig = list.map(function (x) { return x.shop.slug + ":" + x.st.state + ":" + x.st.hoursText; }).join("|");
      if (!force && sig === signature) return;
      // スライド中は並びを変えない（操作が落ち着いてから）
      if (!force && Date.now() < busyUntil) { pending = true; return; }
      signature = sig; pending = false;
      var keep = track.scrollLeft;
      track.innerHTML = list.length ? list.map(function (x) { return card(x); }).join("") :
        '<p class="kb-empty">現在、掲載できる営業店舗情報はありません。</p>';
      track.scrollLeft = keep;
      update();
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max - 2;
      var pages = max > 2 ? Math.ceil(track.scrollWidth / track.clientWidth - 0.05) : 1;
      var cur = max > 2 ? Math.round((track.scrollLeft / max) * (pages - 1)) : 0;
      if (pages <= 1) { dots.innerHTML = ""; return; }
      dots.innerHTML = pages > 8
        ? '<span class="kb-dots-text">' + (cur + 1) + " / " + pages + "</span>"
        : Array.apply(null, Array(pages)).map(function (_, i) { return '<span class="kb-dot' + (i === cur ? " is-on" : "") + '"></span>'; }).join("");
      dots.setAttribute("aria-label", pages + "ページ中 " + (cur + 1) + "ページ目");
    }
    var step = function (dir) { busyUntil = Date.now() + 3000; track.scrollBy({ left: dir * track.clientWidth * 0.85, behavior: "smooth" }); };
    prev.addEventListener("click", function () { step(-1); });
    next.addEventListener("click", function () { step(1); });
    var ticking = false;
    track.addEventListener("scroll", function () {
      busyUntil = Date.now() + 3000;
      if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; update(); }); }
    }, { passive: true });
    window.addEventListener("resize", update);
    dragScroll(track, function () { busyUntil = Date.now() + 3000; });

    render(true);
    setInterval(function () { render(false); if (pending && Date.now() >= busyUntil) render(false); }, 60 * 1000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) render(false); });
    refresher(root.getAttribute("data-api"), shops, function () { render(false); });
  }

  /* マウスでつかんで横に動かす（タッチは標準のスワイプのまま） */
  function dragScroll(el, onMove) {
    var down = false, startX = 0, startLeft = 0, moved = false;
    el.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = el.scrollLeft;
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) { moved = true; el.classList.add("is-dragging"); }
      if (moved) { el.scrollLeft = startLeft - dx; onMove(); e.preventDefault(); }
    });
    window.addEventListener("pointerup", function () {
      if (!down) return;
      down = false;
      if (moved) setTimeout(function () { el.classList.remove("is-dragging"); }, 0);
    });
    el.addEventListener("click", function (e) { if (el.classList.contains("is-dragging")) { e.preventDefault(); e.stopPropagation(); } }, true);
    el.addEventListener("dragstart", function (e) { e.preventDefault(); });
  }

  /* ---------- /shops/today の一覧 ---------- */
  function listPage(root) {
    var shops = readShops(root);
    var results = root.querySelector("[data-results]"), count = root.querySelector("[data-count]");
    var mapBox = root.querySelector("[data-map]"), noPos = root.querySelector("[data-nopos]");
    var view = "card", map = null, layer = null, signature = "";
    try { view = localStorage.getItem("kb-today-view") || "card"; } catch (e) {}

    function chosen(name) { return Array.prototype.map.call(root.querySelectorAll('[data-' + name + '][aria-pressed="true"]'), function (b) { return b.getAttribute("data-" + name); }); }
    function filtered() {
      var st = chosen("status"), genres = chosen("genre"), feats = chosen("feature");
      return evaluate(shops).filter(function (x) {
        var s = x.shop;
        if (st.length && st.indexOf(x.st.state) < 0) return false;
        if (genres.length && genres.indexOf(s.category) < 0) return false;
        for (var i = 0; i < feats.length; i++) {
          var f = feats[i];
          if (f === "late" && !x.st.lateNight) return false;
          if (f === "solo" && s.solo !== true) return false;
          if (f === "nonalc" && s.nonalc !== true) return false;
          if (f !== "late" && f !== "solo" && f !== "nonalc" && (s.features || []).indexOf(f) < 0) return false;
        }
        return true;
      });
    }
    function render(force) {
      var list = filtered();
      var sig = view + "|" + list.map(function (x) { return x.shop.slug + ":" + x.st.state + ":" + x.st.hoursText; }).join("|");
      if (!force && sig === signature) return;
      signature = sig;
      var open = list.filter(function (x) { return x.st.state === "open"; }).length;
      count.textContent = list.length + "件（営業中 " + open + "件）";
      root.querySelectorAll("[data-view]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-view") === view)); });
      mapBox.hidden = view !== "map"; noPos.hidden = view !== "map";
      results.hidden = view === "map";
      if (!list.length) { results.hidden = false; results.innerHTML = '<p class="kb-empty">条件に合うお店がありません。条件を減らしてみてください。</p>'; if (view === "map") drawMap([]); return; }
      if (view === "card") results.innerHTML = '<div class="kb-grid">' + list.map(function (x) { return card(x, " kb-card--grid"); }).join("") + "</div>";
      else if (view === "list") results.innerHTML = '<ul class="kb-list">' + list.map(function (x) {
        return '<li><a href="' + link(x.shop.slug) + '"><span class="kb-list-main"><span class="kb-list-name">' + esc(x.shop.name) + '</span><span class="kb-list-cat">' + esc(x.shop.cat) + "</span></span>" +
          '<span class="kb-list-side">' + badge(x.st) + '<span class="kb-list-hours">' + (x.st.state === "temp_closed" || x.st.state === "closed_day" ? esc(x.st.note) : esc(x.st.hoursText)) + "</span></span></a></li>";
      }).join("") + "</ul>";
      else drawMap(list);
    }

    function drawMap(list) {
      var withPos = list.filter(function (x) { return typeof x.shop.lat === "number" && typeof x.shop.lng === "number"; });
      var without = list.filter(function (x) { return withPos.indexOf(x) < 0; });
      noPos.innerHTML = without.length ? '<p class="kb-nopos-title">地図の位置がまだ登録されていないお店</p><ul class="kb-list">' + without.map(function (x) {
        var q = encodeURIComponent(x.shop.name + " " + (x.shop.address || "秋田市大町"));
        return '<li><a href="https://www.google.com/maps/search/?api=1&query=' + q + '" target="_blank" rel="noopener noreferrer"><span class="kb-list-main"><span class="kb-list-name">' + esc(x.shop.name) + '</span><span class="kb-list-cat">Googleマップで見る ↗</span></span><span class="kb-list-side">' + badge(x.st) + "</span></a></li>";
      }).join("") + "</ul>" : "";
      loadLeaflet(function () {
        var L = window.L;
        if (!map) {
          map = L.map(mapBox, { scrollWheelZoom: false }).setView([39.7178, 140.1195], 16);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
        }
        if (layer) layer.remove();
        layer = L.layerGroup().addTo(map);
        withPos.forEach(function (x) {
          L.marker([x.shop.lat, x.shop.lng]).addTo(layer).bindPopup('<b>' + esc(x.shop.name) + "</b><br>" + x.st.icon + " " + esc(x.st.label) + " " + esc(x.st.hoursText) + '<br><a href="' + link(x.shop.slug) + '">お店のページへ</a>');
        });
        if (withPos.length) map.fitBounds(L.latLngBounds(withPos.map(function (x) { return [x.shop.lat, x.shop.lng]; })).pad(0.3), { maxZoom: 17 });
        setTimeout(function () { map.invalidateSize(); }, 50);
      });
    }

    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-status],[data-genre],[data-feature]");
      if (b) { b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); render(true); return; }
      var v = e.target.closest("[data-view]");
      if (v) { view = v.getAttribute("data-view"); try { localStorage.setItem("kb-today-view", view); } catch (err) {} render(true); return; }
      if (e.target.closest("[data-reset]")) { root.querySelectorAll('[aria-pressed="true"][data-status],[aria-pressed="true"][data-genre],[aria-pressed="true"][data-feature]').forEach(function (x) { x.setAttribute("aria-pressed", "false"); }); render(true); }
    });
    render(true);
    setInterval(function () { render(false); }, 60 * 1000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) render(false); });
    refresher(root.getAttribute("data-api"), shops, function () { render(false); });
  }

  var leafletWaiting = null;
  function loadLeaflet(cb) {
    if (window.L) return cb();
    if (leafletWaiting) return leafletWaiting.push(cb);
    leafletWaiting = [cb];
    var css = document.createElement("link");
    css.rel = "stylesheet"; css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);
    var js = document.createElement("script");
    js.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    js.onload = function () { var w = leafletWaiting; leafletWaiting = null; w.forEach(function (f) { f(); }); };
    document.head.appendChild(js);
  }

  document.querySelectorAll('[data-kb-today="carousel"]').forEach(carousel);
  document.querySelectorAll('[data-kb-today="page"]').forEach(listPage);
})();
