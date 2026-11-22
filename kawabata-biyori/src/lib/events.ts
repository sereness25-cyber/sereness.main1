import type { EventDate, EventItem } from "./types";

/** すべての回（古い順）。日程が1つだけのイベントは starts_at / ends_at から作る */
export function eventDates(e: EventItem): EventDate[] {
  const list = e.dates && e.dates.length ? e.dates : [{ starts_at: e.starts_at, ends_at: e.ends_at }];
  return list.filter((d) => d && d.starts_at).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

const endOf = (d: EventDate) => new Date(d.ends_at ?? d.starts_at).getTime();

/** その回が終わっているか */
export function isDatePast(d: EventDate, now = new Date()) {
  return endOf(d) < now.getTime();
}

/** starts_at / ends_at を「次に開かれる回」に合わせる。すべて終わっていれば最後の回 */
export function withNextDate(e: EventItem, now = new Date()): EventItem {
  const dates = eventDates(e);
  if (!dates.length) return e;
  const next = dates.find((d) => !isDatePast(d, now)) ?? dates[dates.length - 1];
  return { ...e, dates, starts_at: next.starts_at, ends_at: next.ends_at };
}
