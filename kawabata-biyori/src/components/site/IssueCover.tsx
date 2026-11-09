import type { Issue } from "@/lib/data";
import { photoForCategory } from "@/lib/photos";
import { Thumb } from "./Thumb";

const MONTH = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];

/** バックナンバーの小さな表紙。号の巻頭記事の写真に題字を重ねる */
export function IssueCover({ issue, large = false }: { issue: Issue; large?: boolean }) {
  const c = issue.cover;
  return (
    <div className="relative overflow-hidden shadow-[0_6px_18px_-8px_rgb(0_0_0/0.45)]">
      <Thumb src={c.thumbnail} alt="" seed={c.slug} photo={photoForCategory(c.categories[0]?.slug)} className="aspect-[3/4]" sizes={large ? "320px" : "120px"} badgeBottom />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/40" />
      <div className="pointer-events-none absolute inset-x-0 top-0 p-2 text-white">
        <p className={`font-mincho leading-none tracking-wider ${large ? "text-2xl" : "text-[0.7rem]"}`}>かわばた日和</p>
        <p className={`mt-1 font-en tracking-[0.2em] ${large ? "text-xs" : "text-[0.42rem]"}`}>KAWABATA BIYORI</p>
      </div>
      <p className={`pointer-events-none absolute bottom-1.5 left-2 font-en italic text-white ${large ? "text-base" : "text-[0.55rem]"}`}>
        VOL.{String(issue.vol).padStart(2, "0")} · {issue.year} {MONTH[issue.month - 1]}
      </p>
    </div>
  );
}
