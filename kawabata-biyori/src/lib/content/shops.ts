import type { Shop } from "@/lib/types";

/**
 * 公開情報をもとに編集部が調べた川反（秋田市大町）のお店。
 * - 住所・営業時間などは、出典に書かれていた内容だけを載せている
 * - お店本人への確認はまだ（shop_confirmed: false）。確認できたら管理画面で更新する
 * - 写真は使用許可がないため載せていない
 * - 初心者歓迎マークは、掲載基準をお店に確認していないため付けていない
 * supabase/seed.sql にも書き出される（scripts/export-seed.ts）
 */

const CHECKED = "2026-11-09";

type Src = { label: string; url: string };
function shop(p: {
  slug: string;
  name: string;
  category: Shop["category"];
  address: string;
  description: string;
  sources: Src[];
  business_hours?: string;
  closed_days?: string;
  price_range?: string;
  solo_ok?: boolean | null;
  non_alcohol?: boolean | null;
  website?: string | null;
  sns?: Shop["sns"];
  shop_confirmed?: boolean;
}): Shop {
  return {
    id: `shop-${p.slug}`,
    name: p.name,
    slug: p.slug,
    category: p.category,
    description: p.description,
    address: `秋田県秋田市${p.address}`,
    lat: null,
    lng: null,
    business_hours: p.business_hours ?? "",
    closed_days: p.closed_days ?? "",
    price_range: p.price_range ?? "",
    budget_level: null,
    payment_methods: "",
    seats: "",
    solo_ok: p.solo_ok ?? null,
    non_alcohol: p.non_alcohol ?? null,
    beginner_welcome: false,
    sns: p.sns ?? {},
    website: p.website ?? null,
    image: null,
    image_alt: "",
    photo_permission: false,
    verified_at: CHECKED,
    is_published: true,
    updated_at: `${CHECKED}T00:00:00+09:00`,
    sources: p.sources,
    shop_confirmed: p.shop_confirmed ?? false,
  };
}

export const RESEARCHED_SHOPS: Shop[] = [
  shop({
    slug: "cafe-bar-sereness",
    name: "Café & Bar Sereness",
    category: "bar",
    address: "大町5-2-7 SCビル2F",
    description:
      "カラオケ・ゲーム・スポーツ観戦も楽しめるカフェ&バー。飲み放題が基本料金で、ソフトドリンクの飲み放題もあり、お酒を飲まない人や一人での来店も歓迎と案内されています。かわばた日和の運営元です。",
    business_hours: "月・火・木 19:00〜1:00／金・土・祝前日 19:00〜3:00",
    closed_days: "水曜日",
    price_range: "アルコール飲み放題 男性2,650円・女性1,100円／ソフトドリンク飲み放題 男性1,100円・女性550円",
    solo_ok: true,
    non_alcohol: true,
    sns: { instagram: "https://www.instagram.com/cafe_bar.sereness/" },
    website: "https://sereness25-cyber.github.io/sereness.main1/",
    sources: [{ label: "Café & Bar Sereness 公式サイト（運営元）", url: "https://sereness25-cyber.github.io/sereness.main1/" }],
    shop_confirmed: true,
  }),
  shop({
    slug: "kawabata-isariya-sakaba",
    name: "秋田川反漁屋酒場 秋田本店",
    category: "izakaya",
    address: "大町4-2-35",
    description: "新鮮な魚介類と秋田の郷土料理・地酒を楽しめる居酒屋として紹介されています。自分で炙って仕上げるきりたんぽ鍋が特徴とされています。",
    business_hours: "17:00〜24:00",
    closed_days: "無休",
    sources: [
      { label: "公式サイト（丸富水産）", url: "https://marutomisuisan.jpn.com/isariya-akita/" },
      { label: "あきた元気ナビ", url: "https://www.akita-yulala.jp/restaurant/658" },
    ],
    website: "https://marutomisuisan.jpn.com/isariya-akita/",
  }),
  shop({
    slug: "akita-kiritanpoya-omachi",
    name: "秋田きりたんぽ屋 秋田大町分店",
    category: "izakaya",
    address: "大町4-2-20",
    description: "きりたんぽ鍋を名物に、マタギ鍋やハタハタのしょっつる鍋など秋田の郷土料理を扱う居酒屋として紹介されています。営業時間は掲載先によって違うため、お出かけ前にお店へご確認ください。",
    sources: [
      { label: "あきた元気ナビ", url: "https://www.akita-yulala.jp/restaurant/5000018832" },
      { label: "一休.comレストラン", url: "https://restaurant.ikyu.com/147601" },
      { label: "川反外町振興会", url: "https://kawabatatomachi.com/2018/04/24/%E7%A7%8B%E7%94%B0%E3%81%8D%E3%82%8A%E3%81%9F%E3%82%93%E3%81%BD%E5%B1%8B%E3%80%80%E5%A4%A7%E7%94%BA%E5%88%86%E5%BA%97/" },
    ],
  }),
  shop({
    slug: "bar-le-verre",
    name: "BAR ル・ヴェール",
    category: "bar",
    address: "大町4-1-5",
    description: "秋田市大町・川反のバー。公式サイトでは「女性の一人飲みに人気」と紹介されています。JR秋田駅西口から徒歩16分。",
    business_hours: "18:00〜1:00（L.O. 0:30）",
    closed_days: "日曜日、第1・第3月曜日（月曜が祝日の場合は日曜営業・翌月曜休み）",
    solo_ok: true,
    website: "https://www.bar-leverre.com/",
    sources: [{ label: "BAR ル・ヴェール 公式サイト", url: "https://www.bar-leverre.com/" }],
  }),
  shop({
    slug: "bar-aladdin",
    name: "BARアラジン",
    category: "bar",
    address: "大町3-2-22 ジャスマックビル1F",
    description: "ダーツとカラオケを楽しめる飲み放題のバーとして紹介されています。赤れんが郷土館前バス停から徒歩約1分。",
    sources: [{ label: "エキテン", url: "https://www.ekiten.jp/shop_36158497/info/p7/" }],
  }),
  shop({
    slug: "ichinotori-kawabata",
    name: "炭火やきとりと竈めし 一の酉 秋田川反店",
    category: "izakaya",
    address: "大町3-2-30 シャインズビル1F",
    description: "炭火やきとりと竈（かまど）で炊くごはんの店。",
    sources: [{ label: "NAVITIME（秋田市大町の居酒屋一覧）", url: "https://www.navitime.co.jp/category/0308001/05201052000/" }],
  }),
  shop({
    slug: "irori-ya-kawabata",
    name: "いろり家 秋田川反店",
    category: "izakaya",
    address: "大町4-2-26",
    description: "秋田市大町・川反の居酒屋。",
    sources: [{ label: "NAVITIME（秋田市大町の居酒屋一覧）", url: "https://www.navitime.co.jp/category/0308001/05201052000/" }],
  }),
  shop({
    slug: "hanbee-kawabata",
    name: "薄利多賣半兵エ 秋田川反店",
    category: "izakaya",
    address: "大町5-1-3 八番館ビル1F",
    description: "秋田市大町・川反の居酒屋。",
    sources: [{ label: "NAVITIME（秋田市大町の居酒屋一覧）", url: "https://www.navitime.co.jp/category/0308001/05201052000/" }],
  }),
  shop({
    slug: "kawabata-ken",
    name: "川反軒",
    category: "izakaya",
    address: "大町5丁目2-42",
    description: "秋田市大町・川反の居酒屋。",
    sources: [{ label: "Yahoo!マップ", url: "https://map.yahoo.co.jp/v3/place/B6E9aZPgVW2" }],
  }),
  shop({
    slug: "kawabata-hinata",
    name: "川反 日なた",
    category: "izakaya",
    address: "大町4丁目1-14",
    description: "秋田市大町・川反の居酒屋。",
    sources: [{ label: "Yahoo!マップ", url: "https://map.yahoo.co.jp/v3/place/FujyaXQyjQE" }],
  }),
  shop({
    slug: "beniga-raya",
    name: "四丁目 炭火焼 紅がら屋",
    category: "izakaya",
    address: "大町4-2-34",
    description: "秋田市大町・川反の炭火焼の店。",
    sources: [{ label: "ホームメイト（秋田市大町の居酒屋一覧）", url: "https://www.cookdoor.jp/akita/jc05201/zip0100921/list/izakaya/" }],
  }),
  shop({
    slug: "ichirakudo",
    name: "手づくり料理 一楽土",
    category: "izakaya",
    address: "大町5-2-41",
    description: "秋田市大町・川反の手づくり料理の店。",
    sources: [{ label: "ホームメイト（秋田市大町の居酒屋一覧）", url: "https://www.cookdoor.jp/akita/jc05201/zip0100921/list/izakaya/" }],
  }),
  shop({
    slug: "otafuku",
    name: "お多福",
    category: "izakaya",
    address: "大町4-2-25",
    description: "秋田の郷土料理を味わえる店として紹介されています。",
    sources: [{ label: "るるぶ＆more.（秋田の郷土料理の名店案内）", url: "https://plus.rurubu.jp/article/6ah22brietv" }],
  }),
  shop({
    slug: "chawanya",
    name: "ちゃわん屋",
    category: "izakaya",
    address: "大町4-2-7",
    description: "秋田の郷土料理を味わえる店として紹介されています。",
    sources: [{ label: "るるぶ＆more.（秋田の郷土料理の名店案内）", url: "https://plus.rurubu.jp/article/6ah22brietv" }],
  }),
];
