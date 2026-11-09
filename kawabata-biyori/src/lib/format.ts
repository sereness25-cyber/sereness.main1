const TZ = "Asia/Tokyo";

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("ja-JP", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(iso))
    .replace(/\//g, ".");
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: TZ, year: "numeric", month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

export function formatEventDate(starts: string, ends: string | null): string {
  const s = formatDateTime(starts);
  if (!ends) return `${s}〜`;
  const sameDay = new Date(starts).toLocaleDateString("ja-JP", { timeZone: TZ }) === new Date(ends).toLocaleDateString("ja-JP", { timeZone: TZ });
  const e = sameDay
    ? new Intl.DateTimeFormat("ja-JP", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(ends))
    : formatDateTime(ends);
  return `${s}〜${e}`;
}

/** <input type="datetime-local"> の値（日本時間）と ISO 文字列の相互変換 */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}
export function fromLocalInput(v: string | null | undefined): string | null {
  if (!v) return null;
  return new Date(`${v}:00+09:00`).toISOString();
}
