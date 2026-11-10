/* ============================================================
   Café & Bar Sereness 営業スケジュール API
   - …/exec            → 営業スケジュールを JSON で返す(LPが読む)
   - …/exec?page=admin → 管理ページを開く
   - POST {passcode, schedule} → 保存(外部の管理ページ用)
   - POST {action:'upload', passcode, data, mime} → 写真をドライブに保存
   - …/exec?kawabata=export → かわばた日和の公開中データ(GitHub が10分ごとに取りに来る)
   - …/exec?kawabata=today  → かわばた日和「本日営業のお店」用の最新の営業時間(公開ページが読む)
   - POST {action:'shop_…', slug, key, …} → お店ごとの営業時間の管理ページ用
   - POST {action:'kb_…', passcode, …} → かわばた日和の管理ページ用(下のほうにまとめてあります)
   スクリプト プロパティに PASSCODE(合言葉)を入れておくこと。
   写真はドライブの「Sereness LP 写真」フォルダに入り、リンクを知っている人が見られる設定になります。
   ============================================================ */
var KEY = 'SCHEDULE';
var DEFAULT = {
  weekly: {'0':{open:'19:00',close:'25:00'},'1':{open:'19:00',close:'25:00'},'2':{open:'19:00',close:'25:00'},'3':null,
           '4':{open:'19:00',close:'25:00'},'5':{open:'19:00',close:'27:00'},'6':{open:'19:00',close:'27:00'}},
  exceptions: [], notice: '', hoursNote: '※祝前日も3:00まで営業します'
};

var CONTENT_KEY = 'CONTENT';
var DEFAULT_CONTENT = {
  ranking: [
    {name: 'ストロベリーミルク', en: 'Strawberry Milk', desc: '甘くてやさしい、\nセレネスで一番人気の\nドリンクです。', img: ''},
    {name: 'はちみつレモンサワー', en: 'Honey Lemon Sour', desc: 'はちみつのやさしい甘みと、\nさわやかなレモンのサワー。', img: ''},
    {name: 'レモンサワー', en: 'Lemon Sour', desc: 'さっぱり飲みやすい、\n定番のレモンサワー。', img: ''}
  ],
  gallery: {
    hero: {img: '', title: 'カウンターで\n過ごす特別な時間を。', caption: 'バーカウンター'},
    tiles: [{img: '', caption: '店内全体'}, {img: '', caption: 'カクテル'}, {img: '', caption: '夜カフェ'},
            {img: '', caption: 'カラオケ'}, {img: '', caption: 'ボードゲーム'}, {img: '', caption: '宴会・グループ'}]
  }
};

function doGet(e) {
  if (e && e.parameter && e.parameter.kawabata === 'export') return json(kbExport());
  if (e && e.parameter && e.parameter.kawabata === 'today') return json(kbToday());
  if (e && e.parameter && e.parameter.page === 'admin') {
    return HtmlService.createHtmlOutputFromFile('admin')
      .setTitle('営業スケジュール管理 | Café & Bar Sereness')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  return json(getSchedule());
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (String(body.action || '').indexOf('kb_') === 0) return json(kbHandle(body));
    if (String(body.action || '').indexOf('shop_') === 0) return json(shopHandle(body));
    if (body.action === 'upload') return json(uploadImage(body.passcode, body.data, body.mime));
    return json(saveSchedule(body.passcode, body.schedule));
  } catch (err) {
    return json({ok: false, error: String(err && err.message || err)});
  }
}

/* 営業スケジュール + 人気メニュー・ギャラリーの内容 */
function getSchedule() {
  var props = PropertiesService.getScriptProperties();
  var s = props.getProperty(KEY), c = props.getProperty(CONTENT_KEY);
  var out = s ? JSON.parse(s) : JSON.parse(JSON.stringify(DEFAULT));
  out.content = c ? JSON.parse(c) : DEFAULT_CONTENT;
  return out;
}

function checkPass(passcode) {
  var pass = PropertiesService.getScriptProperties().getProperty('PASSCODE');
  if (!pass) return 'スクリプト プロパティに PASSCODE が設定されていません';
  if (String(passcode) !== pass) return '合言葉が違います';
  return '';
}

function saveSchedule(passcode, schedule) {
  var bad = checkPass(passcode);
  if (bad) return {ok: false, error: bad};
  var props = PropertiesService.getScriptProperties();
  var clean = sanitize(schedule);
  var content = schedule.content ? sanitizeContent(schedule.content) : null;
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    props.setProperty(KEY, JSON.stringify(clean));
    if (content) props.setProperty(CONTENT_KEY, JSON.stringify(content));
  } finally { lock.releaseLock(); }
  try { CacheService.getScriptCache().remove('KB_TODAY'); } catch (e) {}
  clean.content = content || getSchedule().content;
  return {ok: true, schedule: clean};
}

/* 写真をドライブに保存して、そのファイルIDを返す */
function uploadImage(passcode, data, mime) {
  var bad = checkPass(passcode);
  if (bad) return {ok: false, error: bad};
  if (!/^image\/(jpeg|png|webp)$/.test(String(mime))) return {ok: false, error: '写真の形式に対応していません'};
  var bytes = Utilities.base64Decode(String(data));
  if (bytes.length > 5 * 1024 * 1024) return {ok: false, error: '写真が大きすぎます'};
  var ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  var file = photoFolder().createFile(Utilities.newBlob(bytes, mime, 'sereness-' + Date.now() + '.' + ext));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return {ok: true, id: file.getId()};
}

function photoFolder() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var folder = DriveApp.createFolder('Sereness LP 写真');
  props.setProperty('FOLDER_ID', folder.getId());
  return folder;
}

function sanitizeContent(c) {
  var ID = /^[\w-]{10,200}$/;
  function text(v, max) { return String(v == null ? '' : v).slice(0, max); }
  function img(v) { return ID.test(String(v || '')) ? String(v) : ''; }
  var d = DEFAULT_CONTENT, r = c.ranking || [], g = c.gallery || {}, hero = g.hero || {}, tiles = g.tiles || [];
  return {
    ranking: d.ranking.map(function(def, i){
      var x = r[i] || {};
      return {name: text(x.name, 30), en: text(x.en, 40), desc: text(x.desc, 120), img: img(x.img)};
    }),
    gallery: {
      hero: {img: img(hero.img), title: text(hero.title, 60), caption: text(hero.caption, 30)},
      tiles: d.gallery.tiles.map(function(def, i){ var x = tiles[i] || {}; return {img: img(x.img), caption: text(x.caption, 20)}; })
    }
  };
}

function sanitize(s) {
  if (!s || typeof s !== 'object' || !s.weekly) throw new Error('スケジュールの形が正しくありません');
  var TIME = /^\d{1,2}:\d{2}$/, DATE = /^\d{4}-\d{2}-\d{2}$/;
  function text(v, max) { return String(v == null ? '' : v).slice(0, max); }
  var weekly = {};
  for (var d = 0; d < 7; d++) {
    var w = s.weekly[d] || s.weekly[String(d)];
    weekly[String(d)] = (w && TIME.test(w.open) && TIME.test(w.close)) ? {open: w.open, close: w.close} : null;
  }
  var exceptions = (s.exceptions || []).filter(function(x){ return x && DATE.test(x.date); }).slice(0, 100).map(function(x){
    var item = {date: x.date, note: text(x.note, 80)};
    if (x.closed || !TIME.test(x.open) || !TIME.test(x.close)) item.closed = true;
    else { item.open = x.open; item.close = x.close; }
    return item;
  });
  return {weekly: weekly, exceptions: exceptions, notice: text(s.notice, 300), hoursNote: text(s.hoursNote, 120), updatedAt: new Date().toISOString()};
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
   かわばた日和 管理ページ用
   - ログインなしで使える(KAWABATA_PASSWORD を設定したときだけパスワードを求める)
   - 記事・お店・イベントはドライブの「かわばた日和 データ」フォルダに JSON で保存
     (最初の1回だけ GitHub にある今のデータを写してくる)
   - 写真はドライブの「かわばた日和 写真」フォルダ(リンクを知っている人が見られる)
   ============================================================ */
var KB_RAW = 'https://raw.githubusercontent.com/sereness25-cyber/sereness.main1/main/kawabata-data/';
var KB_LISTS = ['articles', 'shops', 'events', 'categories'];

function kbHandle(body) {
  var out;
  try {
    var bad = kbPass(body.passcode);
    if (bad) { out = {ok: false, auth: true, error: bad}; }
    else if (body.action === 'kb_login') out = {ok: true};
    else if (body.action === 'kb_load') { out = {ok: true, data: kbLoadAll()}; out.data.shop_keys = Object.keys(kbKeys()); }
    else if (body.action === 'kb_shop_key') out = kbShopKey(String(body.slug || ''));
    else if (body.action === 'kb_save') out = kbSave(body.file, body.item, !!body.remove);
    else if (body.action === 'kb_settings') out = kbSaveSettings(body.settings);
    else if (body.action === 'kb_upload') out = kbUpload(body.data, body.mime);
    else out = {ok: false, error: '知らない操作です'};
  } catch (err) {
    out = {ok: false, error: String(err && err.message || err)};
  }
  out.kb = 1;
  return out;
}

/* パスワードなしで使える。スクリプト プロパティに KAWABATA_PASSWORD を入れたときだけ、パスワードを求める
   (10回続けて間違えると15分間ロック) */
function kbPass(passcode) {
  var pass = PropertiesService.getScriptProperties().getProperty('KAWABATA_PASSWORD');
  if (!pass) return '';
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('KB_FAILS') || 0);
  if (fails >= 10) return 'パスワードを続けて間違えたため、15分間ログインできません。時間をおいてお試しください';
  if (String(passcode == null ? '' : passcode) !== pass) {
    cache.put('KB_FAILS', String(fails + 1), 900);
    return 'パスワードが違います';
  }
  return '';
}

function kbFolder(prop, name) {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(prop);
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var folder = DriveApp.createFolder(name);
  props.setProperty(prop, folder.getId());
  return folder;
}
function kbDataFolder() { return kbFolder('KB_DATA_FOLDER_ID', 'かわばた日和 データ'); }

function kbFile(name) {
  var it = kbDataFolder().getFilesByName(name + '.json');
  return it.hasNext() ? it.next() : null;
}

function kbRead(name) {
  var f = kbFile(name);
  if (f) return JSON.parse(f.getBlob().getDataAsString('UTF-8'));
  var data = kbFetchGithub(name);  // 最初の1回だけ GitHub から写す(写せなければ空のファイルは作らない)
  kbWrite(name, data);
  return data;
}

function kbFetchGithub(name) {
  var res;
  try {
    res = UrlFetchApp.fetch(KB_RAW + name + '.json?t=' + Date.now(), {muteHttpExceptions: true});
  } catch (e) {
    throw new Error('GitHub からデータを写せませんでした。Apps Script のエディタで関数「kawabataSetup」を実行して、許可してください');
  }
  if (res.getResponseCode() !== 200) throw new Error('GitHub の ' + name + '.json を読めませんでした(' + res.getResponseCode() + ')');
  return JSON.parse(res.getContentText('UTF-8'));
}

/* エディタから1回実行する: GitHub にあってドライブにない記事・お店・イベントを足し、空のカテゴリーなどを埋める。
   GitHub 側のほうが新しいものは差し替える。ドライブで編集した内容(より新しいもの)は上書きしない */
function kawabataSetup() {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  var report = [];
  try {
    KB_LISTS.forEach(function(k){
      var gh = kbFetchGithub(k)[k] || [];
      var f = kbFile(k);
      var cur = f ? (JSON.parse(f.getBlob().getDataAsString('UTF-8'))[k] || []) : [];
      var byId = {}, updated = 0;
      gh.forEach(function(x){ if (x && x.id) byId[x.id] = x; });
      cur = cur.map(function(x){
        var g = x && byId[x.id];
        if (g && String(g.updated_at || '') > String(x.updated_at || '')) { updated++; return g; }  // GitHub のほうが新しければ差し替え
        return x;
      });
      var ids = {};
      cur.forEach(function(x){ if (x && x.id) ids[x.id] = true; });
      var added = gh.filter(function(x){ return x && x.id && !ids[x.id]; });
      var data = {};
      data[k] = added.concat(cur);
      kbWrite(k, data);
      report.push(k + ': ' + added.length + '件追加・' + updated + '件更新(合計' + data[k].length + '件)');
    });
    var sf = kbFile('settings');
    if (!sf) kbWrite('settings', kbFetchGithub('settings'));
  } finally { lock.releaseLock(); }
  Logger.log(report.join('\n'));
  return report;
}

function kbWrite(name, data) {
  var text = JSON.stringify(data, null, 2) + '\n';
  var f = kbFile(name);
  if (f) f.setContent(text);
  else kbDataFolder().createFile(name + '.json', text, 'application/json');
}

function kbLoadAll() {
  var c = kbFile('categories');
  if (c && !(JSON.parse(c.getBlob().getDataAsString('UTF-8')).categories || []).length) kawabataSetup();  // 以前の失敗で空になっていたら埋め直す
  var out = {};
  KB_LISTS.forEach(function(k){ out[k] = kbRead(k)[k] || []; });
  out.settings = kbRead('settings');
  return out;
}

/* 1件だけ書き換える(ほかの端末の変更を消さないよう、ロックしてから読み直す) */
function kbSave(file, item, remove) {
  if (['articles', 'shops', 'events'].indexOf(file) < 0) return {ok: false, error: '保存先が正しくありません'};
  if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id || item.id.length > 100) return {ok: false, error: 'データの形が正しくありません'};
  if (file === 'shops') {
    if (item.slug === 'today') return {ok: false, error: '「today」はURLスラッグに使えません(本日営業のお店のページと重なるため)'};
    item.hours = kbCleanHours(item.hours);
    item.specials = kbCleanSpecials(item.specials);
    item.features = (Array.isArray(item.features) ? item.features : []).map(String).filter(function(f){ return /^[a-z_]{1,20}$/.test(f); }).slice(0, 20);
    try { CacheService.getScriptCache().remove('KB_TODAY'); } catch (e) {}
  }
  if (JSON.stringify(item).length > 1000000) return {ok: false, error: '内容が大きすぎます'};
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var data = kbRead(file), list = data[file] || [], i = -1;
    for (var n = 0; n < list.length; n++) if (list[n] && list[n].id === item.id) { i = n; break; }
    if (remove) { if (i >= 0) list.splice(i, 1); }
    else if (i >= 0) list[i] = item; else list.unshift(item);
    data[file] = list;
    kbWrite(file, data);
    return {ok: true, list: list};
  } finally { lock.releaseLock(); }
}

var KB_PHOTO_KEYS = ['hero', 'people', 'street', 'cocktail', 'beef', 'river', 'portrait', 'izakaya', 'bar', 'snack', 'whisky'];

/* SNSリンクとイメージ写真。送られてきた項目だけ書き換える */
function kbSaveSettings(s) {
  s = s || {};
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var next = kbRead('settings') || {};
    ['instagram', 'x', 'facebook', 'youtube'].forEach(function(k){
      if (!(k in s)) return;
      var v = String(s[k] || '').trim().slice(0, 300);
      next[k] = /^https:\/\//.test(v) ? v : '';
    });
    if (s.photos && typeof s.photos === 'object') {
      var photos = {};
      KB_PHOTO_KEYS.forEach(function(k){
        var p = s.photos[k];
        if (p && /^https:\/\/[^\s"'<>]+$/.test(String(p.url || '')) && String(p.url).length <= 500) {
          photos[k] = {url: String(p.url), alt: String(p.alt || '').slice(0, 80)};
        }
      });
      next.photos = photos;
    }
    kbWrite('settings', next);
    return {ok: true, settings: next};
  } finally { lock.releaseLock(); }
}

function kbUpload(data, mime) {
  if (!/^image\/(jpeg|png|webp)$/.test(String(mime))) return {ok: false, error: '写真の形式に対応していません'};
  var bytes = Utilities.base64Decode(String(data));
  if (bytes.length > 8 * 1024 * 1024) return {ok: false, error: '写真が大きすぎます'};
  var ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  var file = kbFolder('KB_PHOTO_FOLDER_ID', 'かわばた日和 写真').createFile(Utilities.newBlob(bytes, mime, 'kawabata-' + Date.now() + '.' + ext));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return {ok: true, url: 'https://lh3.googleusercontent.com/d/' + file.getId()};
}

/* 公開してよいものだけを返す(下書き・非公開・予約前の記事は出さない) */
function kbExport() {
  var now = Date.now(), d = kbLoadAll();
  return {
    kb: 1,
    articles: d.articles.filter(function(a){
      return a && (a.status === 'published' || a.status === 'scheduled') && a.published_at && Date.parse(a.published_at) <= now;
    }),
    shops: d.shops.filter(function(s){ return s && s.is_published; }).map(kbApplySereness),
    events: d.events.filter(function(e){ return e && e.is_published; }),
    categories: d.categories,
    settings: d.settings
  };
}

/* ============================================================
   かわばた日和「本日営業のお店」
   - お店の営業時間: shop.hours = {"0":日曜 … "6":土曜}、各曜日 {closed, ranges:[{open,close}], closed_nth:[1,3]}
     閉店が開店と同じか早い時刻なら翌日に閉店(19:00〜03:00)。"25:00" の書き方も可
   - 臨時休業・臨時営業・時間変更: shop.specials = [{date, closed, ranges, note}]
   - お店ごとの合言葉(ハッシュ)はドライブの shop_keys.json。GitHub には出さない
   - Café & Bar Sereness は、お店の営業スケジュール(上の SCHEDULE)をそのまま使う
   ============================================================ */
var KB_SERENESS = 'cafe-bar-sereness';
var KB_TIME = /^([01]?\d|[2-4]\d):[0-5]\d$/;

function kbCleanRanges(rs) {
  return (Array.isArray(rs) ? rs : []).filter(function(r){
    return r && KB_TIME.test(String(r.open)) && KB_TIME.test(String(r.close)) && String(r.open) !== String(r.close);
  }).slice(0, 4).map(function(r){ return {open: String(r.open), close: String(r.close)}; });
}

function kbCleanHours(h) {
  if (!h || typeof h !== 'object') return null;
  var out = {}, any = false;
  for (var d = 0; d < 7; d++) {
    var w = h[d] || h[String(d)] || {};
    var ranges = kbCleanRanges(w.ranges);
    var nth = (Array.isArray(w.closed_nth) ? w.closed_nth : []).map(Number).filter(function(n){ return n >= 1 && n <= 5; });
    var closed = !!w.closed || !ranges.length;
    out[String(d)] = {closed: closed, ranges: closed ? [] : ranges};
    if (!closed && nth.length) out[String(d)].closed_nth = nth;
    if (w.closed !== undefined || ranges.length) any = true;
  }
  return any ? out : null;
}

function kbToday0() {
  var t = new Date(Date.now() + 9 * 3600 * 1000 - 7 * 86400 * 1000);  // 1週間より前の臨時変更は消す
  return t.toISOString().slice(0, 10);
}

function kbCleanSpecials(list) {
  var from = kbToday0(), seen = {};
  return (Array.isArray(list) ? list : []).filter(function(x){
    return x && /^\d{4}-\d{2}-\d{2}$/.test(String(x.date)) && String(x.date) >= from;
  }).map(function(x){
    var note = String(x.note == null ? '' : x.note).slice(0, 60);
    if (x.closed) return {date: String(x.date), closed: true, note: note};
    var ranges = kbCleanRanges(x.ranges);
    return ranges.length ? {date: String(x.date), closed: false, ranges: ranges, note: note} : null;
  }).filter(function(x){
    if (!x || seen[x.date]) return false;
    seen[x.date] = true;
    return true;
  }).sort(function(a, b){ return a.date < b.date ? -1 : 1; }).slice(0, 100);
}

/* Sereness は、お店の営業スケジュール管理ページの内容を使う */
function kbApplySereness(shop) {
  if (!shop || shop.slug !== KB_SERENESS) return shop;
  var sc = getSchedule(), hours = {};
  for (var d = 0; d < 7; d++) {
    var w = sc.weekly && sc.weekly[String(d)];
    hours[String(d)] = w ? {closed: false, ranges: [{open: w.open, close: w.close}]} : {closed: true, ranges: []};
  }
  var specials = kbCleanSpecials((sc.exceptions || []).map(function(x){
    return x.closed ? {date: x.date, closed: true, note: x.note} : {date: x.date, closed: false, ranges: [{open: x.open, close: x.close}], note: x.note};
  }));
  var copy = JSON.parse(JSON.stringify(shop));
  copy.hours = hours;
  copy.specials = specials;
  return copy;
}

/* 公開ページが数分ごとに読む、最新の営業時間(1分だけ覚えておく) */
function kbToday() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('KB_TODAY');
  if (hit) return JSON.parse(hit);
  var shops = (kbRead('shops').shops || []).filter(function(s){ return s && s.is_published; }).map(kbApplySereness).map(function(s){
    return {slug: s.slug, hours: s.hours || null, specials: s.specials || []};
  });
  var out = {kb: 1, shops: shops, at: new Date().toISOString()};
  try { cache.put('KB_TODAY', JSON.stringify(out), 60); } catch (e) {}
  return out;
}

/* ---------- お店ごとの合言葉 ---------- */
function kbKeys() {
  var f = kbFile('shop_keys');
  return f ? JSON.parse(f.getBlob().getDataAsString('UTF-8')) : {};
}
function kbHash(slug, key) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'kawabata:' + slug + ':' + key, Utilities.Charset.UTF_8);
  return raw.map(function(b){ return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}

/* 編集部の管理ページから、お店用の合言葉を発行する(発行し直すと前の合言葉は使えなくなる) */
function kbShopKey(slug) {
  var shops = kbRead('shops').shops || [];
  if (!shops.some(function(s){ return s && s.slug === slug; })) return {ok: false, error: '先にお店を保存してください'};
  var key = Utilities.getUuid().replace(/-/g, '').slice(0, 12);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var keys = kbKeys();
    keys[slug] = kbHash(slug, key);
    kbWrite('shop_keys', keys);
  } finally { lock.releaseLock(); }
  return {ok: true, key: key};
}

function shopCheck(slug, key) {
  var cache = CacheService.getScriptCache(), ck = 'SHOP_FAIL_' + slug;
  var fails = Number(cache.get(ck) || 0);
  if (fails >= 10) return '合言葉を続けて間違えたため、15分間ログインできません。時間をおいてお試しください';
  var keys = kbKeys();
  if (!slug || !keys[slug] || keys[slug] !== kbHash(slug, String(key || ''))) {
    cache.put(ck, String(fails + 1), 900);
    return 'お店のページのURLか合言葉が違います';
  }
  return '';
}

function shopHandle(body) {
  var out;
  try {
    var slug = String(body.slug || '');
    var bad = shopCheck(slug, body.key);
    if (bad) out = {ok: false, auth: true, error: bad};
    else if (body.action === 'shop_load') {
      var s = kbApplySereness((kbRead('shops').shops || []).filter(function(x){ return x && x.slug === slug; })[0]);
      out = s ? {ok: true, shop: {name: s.name, slug: s.slug, hours: s.hours || null, specials: s.specials || [], linked: slug === KB_SERENESS}} : {ok: false, error: 'お店が見つかりません'};
    }
    else if (body.action === 'shop_save') out = shopSave(slug, body.hours, body.specials);
    else out = {ok: false, error: '知らない操作です'};
  } catch (err) {
    out = {ok: false, error: String(err && err.message || err)};
  }
  out.kb = 1;
  return out;
}

/* お店が変えられるのは、自分のお店の営業時間と臨時変更だけ */
function shopSave(slug, hours, specials) {
  if (slug === KB_SERENESS) return {ok: false, error: 'Serenessの営業時間は、お店の営業スケジュール管理ページで変更してください'};
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var data = kbRead('shops'), list = data.shops || [], hit = null;
    for (var i = 0; i < list.length; i++) if (list[i] && list[i].slug === slug) { hit = list[i]; break; }
    if (!hit) return {ok: false, error: 'お店が見つかりません'};
    hit.hours = kbCleanHours(hours);
    hit.specials = kbCleanSpecials(specials);
    hit.updated_at = new Date().toISOString();
    kbWrite('shops', data);
    try { CacheService.getScriptCache().remove('KB_TODAY'); } catch (e) {}
    return {ok: true, shop: {name: hit.name, slug: hit.slug, hours: hit.hours, specials: hit.specials}};
  } finally { lock.releaseLock(); }
}
