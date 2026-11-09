/** 写真が用意できるまでのメインビジュアル。夕暮れの川沿いに灯りがともるイメージ */
export function HeroArt() {
  const lanterns = [60, 150, 240, 330, 420, 510, 600, 690, 780, 870, 960, 1050, 1140];
  return (
    <svg viewBox="0 0 1200 620" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f5170" />
          <stop offset=".45" stopColor="#8f8fb0" />
          <stop offset=".8" stopColor="#e9b9b6" />
          <stop offset="1" stopColor="#f5d9c9" />
        </linearGradient>
        <linearGradient id="river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6f7f9c" />
          <stop offset="1" stopColor="#34445c" />
        </linearGradient>
        <radialGradient id="glow">
          <stop offset="0" stopColor="#ffe3b5" stopOpacity=".95" />
          <stop offset="1" stopColor="#ffe3b5" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1200" height="620" fill="url(#sky)" />
      <circle cx="930" cy="120" r="46" fill="#fff6ea" opacity=".9" />
      <circle cx="948" cy="108" r="42" fill="#7f86a6" opacity=".9" />
      {/* 街並みのシルエット */}
      <path d="M0 360V270h70v-30h60v40h50v-60h80v50h40v-30h70v60h60v-40h90v30h50v-50h70v60h60v-30h80v40h60v-60h70v50h60v-20h80v30h70v-40h50v80Z" fill="#4b5874" opacity=".85" />
      {[...Array(28)].map((_, i) => (
        <rect key={i} x={30 + i * 42} y={290 + (i % 3) * 18} width="10" height="12" rx="2" fill="#ffd9a0" opacity={0.5 + (i % 4) * 0.12} />
      ))}
      {/* 川岸と灯り */}
      <rect y="356" width="1200" height="20" fill="#5b6681" />
      <path d="M0 362Q600 330 1200 362" fill="none" stroke="#2e3a52" strokeWidth="2" />
      {lanterns.map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={344 + Math.sin(i) * 4} r="26" fill="url(#glow)" />
          <ellipse cx={x} cy={344 + Math.sin(i) * 4} rx="7" ry="10" fill="#ffcf8a" />
        </g>
      ))}
      <rect y="376" width="1200" height="244" fill="url(#river)" />
      {lanterns.map((x, i) => (
        <rect key={x} x={x - 3} y={392 + (i % 3) * 10} width="6" height={60 + (i % 4) * 14} rx="3" fill="#ffcf8a" opacity=".28" />
      ))}
      {[420, 470, 520, 570].map((y, i) => (
        <path key={y} d={`M0 ${y}q150 -12 300 0t300 0 300 0 300 0`} fill="none" stroke="#ffffff" strokeOpacity={0.12 - i * 0.02} strokeWidth="2" />
      ))}
    </svg>
  );
}
