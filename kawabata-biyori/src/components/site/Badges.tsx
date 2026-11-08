export function CategoryBadge({ name }: { name: string }) {
  return <span className="inline-block rounded-full bg-rose/20 px-3 py-0.5 text-[0.75rem] font-bold text-rose-deep">{name}</span>;
}

export function DraftBadge() {
  return <span className="inline-block rounded-full border border-dashed border-navy/40 px-2.5 py-0.5 text-[0.7rem] text-navy/70">公開前の下書き</span>;
}

export function SampleBadge() {
  return <span className="inline-block rounded-full bg-navy px-2.5 py-0.5 text-[0.7rem] font-bold text-white">架空のサンプル</span>;
}

export function PrBadge() {
  return <span className="inline-block rounded bg-ink px-2 py-0.5 text-[0.7rem] font-bold text-white">PR</span>;
}

export function BeginnerMark({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-[#fdf3e3] font-bold text-[#a26a1f] ring-1 ring-[#efd2a3] ${size === "lg" ? "px-3.5 py-1 text-sm" : "px-2.5 py-0.5 text-[0.72rem]"}`}>
      <svg width={size === "lg" ? 16 : 12} height={size === "lg" ? 16 : 12} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2 4 6v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6Z" fill="#f2b54c" />
        <path d="m8.5 12 2.3 2.3 4.7-4.8" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
      初心者歓迎
    </span>
  );
}
