/* ============================================================
   Café & Bar Sereness 営業スケジュール API
   - …/exec            → 営業スケジュールを JSON で返す(LPが読む)
   - …/exec?page=admin → 管理ページを開く
   - POST {passcode, schedule} → 保存(外部の管理ページ用)
   - POST {action:'upload', passcode, data, mime} → 写真をドライブに保存
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
