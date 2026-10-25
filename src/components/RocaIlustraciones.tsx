/* Ilustraciones originales (SVG) para el selector de tipos de roca. */

export function IlustracionVolcan({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label="Volcán en erupción">
      <defs>
        <linearGradient id="v-cielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#fecaca" />
        </linearGradient>
        <linearGradient id="v-cono" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#57534e" />
          <stop offset="1" stopColor="#292524" />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#v-cielo)" />
      {/* Nube de ceniza */}
      <g fill="#a8a29e" opacity="0.9">
        <circle cx="100" cy="22" r="11" />
        <circle cx="114" cy="16" r="10" />
        <circle cx="88" cy="14" r="8" />
        <circle cx="124" cy="26" r="7" />
        <circle cx="78" cy="26" r="7" />
      </g>
      {/* Bombas volcánicas */}
      <g fill="#f97316">
        <circle cx="70" cy="40" r="2" />
        <circle cx="134" cy="36" r="2.2" />
        <circle cx="118" cy="44" r="1.6" />
        <circle cx="84" cy="46" r="1.6" />
      </g>
      {/* Montañas de fondo */}
      <path d="M0 96 L30 74 L52 90 L0 120 Z" fill="#a8a29e" />
      <path d="M200 92 L172 72 L150 90 L200 120 Z" fill="#a8a29e" />
      {/* Cono */}
      <path d="M28 120 L88 48 L112 48 L172 120 Z" fill="url(#v-cono)" />
      {/* Cráter y lava */}
      <ellipse cx="100" cy="48" rx="13" ry="3" fill="#ef4444" />
      <path d="M100 47 C104 30 96 34 100 24 C104 34 98 32 102 47 Z" fill="#fb923c" />
      <path d="M93 49 C90 62 96 70 88 84 C86 92 80 98 78 106 L84 106 C88 96 94 90 96 80 C99 68 96 60 98 49 Z" fill="#ef4444" />
      <path d="M106 49 C110 60 106 66 114 78 C118 86 122 92 126 102 L121 103 C116 94 110 88 108 78 C105 66 106 58 103 49 Z" fill="#f97316" />
      {/* Suelo */}
      <rect y="112" width="200" height="8" fill="#44403c" />
    </svg>
  )
}

export function IlustracionEstratos({ className }: { className?: string }) {
  const capas = [
    { y: 34, h: 12, c: '#fde68a' },
    { y: 46, h: 10, c: '#d6a35c' },
    { y: 56, h: 14, c: '#e7c590' },
    { y: 70, h: 8, c: '#a16207' },
    { y: 78, h: 12, c: '#d4d4d8' },
    { y: 90, h: 10, c: '#c2855a' },
    { y: 100, h: 20, c: '#92614a' },
  ]
  return (
    <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label="Estratos de rocas sedimentarias">
      <defs>
        <linearGradient id="e-cielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bae6fd" />
          <stop offset="1" stopColor="#fef3c7" />
        </linearGradient>
        <clipPath id="e-acantilado">
          <path d="M0 36 C30 32 50 38 80 34 C110 30 140 38 170 33 C185 31 195 34 200 34 L200 120 L0 120 Z" />
        </clipPath>
      </defs>
      <rect width="200" height="120" fill="url(#e-cielo)" />
      <circle cx="168" cy="16" r="7" fill="#fcd34d" />
      <g clipPath="url(#e-acantilado)">
        {capas.map((k, i) => (
          <path
            key={i}
            d={`M0 ${k.y} C50 ${k.y - 3} 100 ${k.y + 3} 200 ${k.y - 1} L200 ${k.y + k.h + 1} C100 ${k.y + k.h + 4} 50 ${k.y + k.h - 2} 0 ${k.y + k.h} Z`}
            fill={k.c}
          />
        ))}
        {/* Clastos y fósiles */}
        <g fill="#78716c">
          <circle cx="30" cy="84" r="1.6" />
          <circle cx="62" cy="86" r="1.2" />
          <circle cx="140" cy="83" r="1.5" />
          <circle cx="176" cy="85" r="1.1" />
        </g>
        <path d="M110 62 a4 4 0 1 1 -1 3 a2.5 2.5 0 1 0 1 -2" fill="none" stroke="#78350f" strokeWidth="0.9" />
        <path d="M44 107 l5 -3 l5 3 l-5 2 z" fill="#78350f" opacity="0.6" />
      </g>
      {/* Pasto en la cima */}
      <path d="M0 36 C30 32 50 38 80 34 C110 30 140 38 170 33 C185 31 195 34 200 34 L200 37 C195 37 185 34 170 36 C140 41 110 33 80 37 C50 41 30 35 0 39 Z" fill="#65a30d" />
    </svg>
  )
}

export function IlustracionMetamorfica({ className }: { className?: string }) {
  // Bandas plegadas de un gneis, con porfiroblastos de granate
  const bandas = Array.from({ length: 9 }, (_, i) => i)
  return (
    <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label="Roca metamórfica con bandas plegadas">
      <rect width="200" height="120" fill="#ede9fe" />
      <g>
        {bandas.map((i) => {
          const y = 6 + i * 13
          const oscura = i % 2 === 1
          return (
            <path
              key={i}
              d={`M-10 ${y} C25 ${y - 18} 45 ${y + 22} 80 ${y} S135 ${y - 20} 160 ${y} S195 ${y + 16} 215 ${y}
                  L215 ${y + 13} C195 ${y + 29} 185 ${y + 13} 160 ${y + 13} S115 ${y - 7} 80 ${y + 13} S25 ${y - 5} -10 ${y + 13} Z`}
              fill={oscura ? '#3f3f46' : i % 4 === 0 ? '#e4e4e7' : '#f5d0fe'}
            />
          )
        })}
      </g>
      {/* Granates */}
      <g fill="#b91c1c" stroke="#7f1d1d" strokeWidth="0.6">
        <polygon points="40,30 44,27 48,30 46,35 42,35" />
        <polygon points="120,58 125,55 129,59 127,64 122,63" />
        <polygon points="160,92 164,89 168,92 166,97 162,97" />
        <polygon points="70,86 73,84 76,87 75,90 71,90" />
      </g>
      {/* Brillo de micas */}
      <g stroke="#ffffff" strokeWidth="0.8" opacity="0.7">
        <line x1="95" y1="24" x2="101" y2="22" />
        <line x1="20" y1="66" x2="26" y2="64" />
        <line x1="176" y1="46" x2="182" y2="44" />
      </g>
    </svg>
  )
}
