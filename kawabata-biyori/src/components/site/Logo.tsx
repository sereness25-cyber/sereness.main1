import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="かわばた日和 ホーム">
      <svg width="34" height="34" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="19" fill={light ? "#ffffff22" : "#fbeff0"} stroke="#d9a7ad" />
        <path d="M27 9a11 11 0 1 0 4 15 9 9 0 1 1-4-15Z" fill="#d9a7ad" />
        <path d="M7 27c4 2.5 8 2.5 13 0s9-2.5 13 0" fill="none" stroke={light ? "#fff" : "#34445c"} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M9 31c3.5 2 7 2 11 0s7.5-2 11 0" fill="none" stroke={light ? "#fff" : "#34445c"} strokeWidth="1.2" strokeLinecap="round" opacity=".6" />
      </svg>
      <span className="leading-none">
        <span className={`block font-maru text-[1.15rem] font-bold tracking-wider ${light ? "text-white" : "text-navy"}`}>かわばた日和</span>
        <span className={`mt-1 block font-en text-[0.68rem] tracking-[0.3em] ${light ? "text-white/80" : "text-rose-deep"}`}>KAWABATA BIYORI</span>
      </span>
    </Link>
  );
}
