import Image from "next/image";

const PALETTES = [
  ["#f3dde0", "#d9a7ad"],
  ["#e7ebf2", "#8c9bb3"],
  ["#f1e7db", "#c9a98a"],
  ["#eae3ef", "#a99abd"],
];

/** アイキャッチ。画像がない記事はカテゴリー名入りのイラスト風プレースホルダーを出す */
export function Thumb({
  src,
  alt,
  label,
  seed = "",
  isAi = false,
  priority = false,
  sizes = "(min-width:1024px) 380px, (min-width:640px) 50vw, 100vw",
  className = "",
}: {
  src: string | null;
  alt: string;
  label?: string;
  seed?: string;
  isAi?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  if (src) {
    return (
      <div className={`relative aspect-[16/9] overflow-hidden bg-beige ${className}`}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        {isAi && <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2.5 py-0.5 text-[0.7rem] text-white">イメージ画像</span>}
      </div>
    );
  }
  const n = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
  const [bg, fg] = PALETTES[n % PALETTES.length];
  return (
    <div className={`relative aspect-[16/9] overflow-hidden ${className}`} style={{ background: bg }} role="img" aria-label={alt || label || "かわばた日和"}>
      <svg viewBox="0 0 320 180" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <circle cx="262" cy="46" r="22" fill="#fff" opacity=".7" />
        <circle cx="270" cy="40" r="20" fill={bg} />
        {[30, 70, 110, 150, 190].map((x, i) => (
          <g key={x} opacity=".9">
            <line x1={x} y1="0" x2={x} y2={58 + (i % 2) * 8} stroke={fg} strokeWidth="1" />
            <ellipse cx={x} cy={70 + (i % 2) * 8} rx="9" ry="12" fill="#fff" stroke={fg} />
          </g>
        ))}
        <path d="M0 140c40 10 80 10 120 0s80-10 120 0 60 10 80 4v40H0Z" fill={fg} opacity=".35" />
        <path d="M0 154c40 8 80 8 120 0s80-8 120 0 60 8 80 3v26H0Z" fill={fg} opacity=".5" />
      </svg>
      {label && (
        <span className="absolute left-4 top-4 font-en text-sm italic tracking-widest text-navy/70">{label}</span>
      )}
    </div>
  );
}
