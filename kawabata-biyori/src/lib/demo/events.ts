import type { EventItem } from "@/lib/types";

/** デモ表示用の「架空の」イベント。Supabase に接続すると表示されなくなります */
export const DEMO_EVENTS: EventItem[] = [
  {
    id: "sample-event-1",
    title: "（サンプル）川反はじめてさんの夜歩き",
    slug: "sample-night-walk",
    starts_at: "2027-01-23T18:30:00+09:00",
    ends_at: "2027-01-23T20:30:00+09:00",
    venue: "川反エリア（架空）",
    fee: "無料（例）",
    content: "<p>イベント表示の見え方を確認するための架空のイベントです。実際のイベントは管理画面から登録してください。</p>",
    organizer: "かわばた日和編集部（例）",
    how_to_apply: "お問い合わせフォームから（例）",
    image: null,
    image_alt: "",
    is_published: true,
    updated_at: "2026-11-01T00:00:00+09:00",
    is_sample: true,
  },
];
