import { useId } from 'react';
import { img, business } from '../config/site.js';

const uid = (id) => id.replace(/[^a-zA-Z0-9_-]/g, '');

/* ---------- Brand logo (NTT emblem from your posters) ---------- */
export function LogoMark({ className = 'h-11 w-11' }) {
  return (
    <span className={`inline-block shrink-0 overflow-hidden rounded-full bg-[#0b1526] ring-2 ring-gold-400/80 ${className}`}>
      <img src={img(business.logo)} alt="NTT Travel logo" className="h-full w-full scale-[1.12] object-cover" width="96" height="96" decoding="async" />
    </span>
  );
}

/* ---------- Cars (side view, facing right) ---------- */
function Wheel({ cx }) {
  return (
    <g>
      <circle cx={cx} cy="100" r="21" fill="#111827" />
      <circle cx={cx} cy="100" r="13" fill="#cfd6e2" />
      <circle cx={cx} cy="100" r="13" fill="none" stroke="#8a94a6" strokeWidth="1.5" />
      {[0, 60, 120].map((a) => (
        <rect key={a} x={cx - 1.5} y="88" width="3" height="24" rx="1.5" fill="#8a94a6" transform={`rotate(${a} ${cx} 100)`} />
      ))}
      <circle cx={cx} cy="100" r="4" fill="#4b5563" />
    </g>
  );
}

export function CarArt({ kind = 'sedan', color = '#f5f7fb', className = '', width, height, x, y }) {
  const id = uid(useId());
  const sedan = kind === 'sedan';
  const body = sedan
    ? 'M20 96 L20 78 Q22 66 40 63 L96 58 L130 35 Q140 28 160 28 L214 28 Q232 28 245 40 L268 58 Q300 62 306 72 L308 94 Q308 100 302 100 L262 100 A24 24 0 0 0 214 100 L102 100 A24 24 0 0 0 54 100 L26 100 Q20 100 20 96Z'
    : 'M16 94 L16 46 Q16 30 34 28 L236 26 Q254 26 262 36 L284 58 Q306 62 312 74 L312 94 Q312 100 306 100 L270 100 A24 24 0 0 0 222 100 L106 100 A24 24 0 0 0 58 100 L22 100 Q16 100 16 94Z';
  const windows = sedan
    ? ['M108 58 L135 38 Q142 33 155 33 L180 33 L180 58Z', 'M186 33 L212 33 Q226 33 236 43 L251 58 L186 58Z']
    : ['M30 34 L70 33 L70 58 L27 58 Q26 41 30 34Z', 'M78 33 L150 32 L150 58 L78 58Z', 'M158 32 L234 31 Q246 31 253 39 L270 58 L158 58Z'];
  const wheels = sedan ? [78, 238] : [82, 246];
  return (
    <svg viewBox="0 0 330 130" width={width} height={height} x={x} y={y} className={className} role="img" aria-label={sedan ? 'Sedan car illustration' : 'MPV family car illustration'}>
      <defs>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".9" />
          <stop offset=".35" stopColor={color} />
          <stop offset="1" stopColor={color} stopOpacity=".75" />
        </linearGradient>
        <linearGradient id={`w${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a5a8c" />
          <stop offset="1" stopColor="#0f2245" />
        </linearGradient>
      </defs>
      <ellipse cx="165" cy="121" rx="150" ry="7" fill="#000" opacity=".18" />
      <path d={body} fill={`url(#b${id})`} stroke="#1f2937" strokeOpacity=".35" strokeWidth="1.2" />
      <path d={body} fill="#0a1834" opacity=".07" transform="translate(0 6) scale(1 .97)" />
      {windows.map((d) => <path key={d} d={d} fill={`url(#w${id})`} />)}
      <path d={sedan ? 'M112 56 L136 39 L150 39 L126 56Z' : 'M82 56 L96 35 L108 35 L94 56Z'} fill="#fff" opacity=".22" />
      <path d={sedan ? 'M24 80 L304 80' : 'M20 78 L310 78'} stroke="#0a1834" strokeOpacity=".25" strokeWidth="2" />
      <path d={sedan ? 'M183 60 L183 98' : 'M154 60 L154 98'} stroke="#1f2937" strokeOpacity=".3" strokeWidth="1.2" />
      <rect x={sedan ? 160 : 132} y="66" width="12" height="3" rx="1.5" fill="#6b7280" />
      <rect x={sedan ? 212 : 196} y="66" width="12" height="3" rx="1.5" fill="#6b7280" />
      <path d={sedan ? 'M290 66 Q302 68 305 74 L290 74Z' : 'M296 66 Q308 69 311 76 L296 76Z'} fill="#ffd866" />
      <rect x={sedan ? 20 : 16} y={sedan ? 70 : 52} width="7" height={sedan ? 10 : 16} rx="2" fill="#e8590c" />
      <path d={sedan ? 'M250 56 l10 -2 2 6 -10 1z' : 'M268 54 l10 -2 2 6 -10 1z'} fill="#1f2937" />
      <rect x={sedan ? 286 : 290} y="86" width="22" height="6" rx="3" fill="#9ca3af" />
      {wheels.map((cx) => <Wheel key={cx} cx={cx} />)}
    </svg>
  );
}

/* ---------- Scenes for services, destinations and gallery ---------- */
const skies = {
  temple: ['#ff9a3c', '#ffe1a8'],
  beach: ['#6cc3ef', '#e6f6ff'],
  hills: ['#8ccfe6', '#eef9f2'],
  waterfall: ['#8fa7a8', '#dfe9e4'],
  fort: ['#f57c00', '#ffd3a1'],
  city: ['#0f2245', '#f2a65a'],
  airport: ['#5aa9e6', '#e2f1fc'],
  office: ['#9cc6ee', '#eef6ff'],
  family: ['#ffb35c', '#fff0d1'],
  road: ['#152c56', '#ff9a3c'],
};

function Subject({ kind }) {
  switch (kind) {
    case 'temple':
      return (
        <g>
          <path d="M120 200 L120 150 L280 150 L280 200Z" fill="#8a3b12" />
          <path d="M160 150 L170 112 Q200 40 230 112 L240 150Z" fill="#b5501a" />
          <path d="M184 150 L190 110 Q200 70 210 110 L216 150Z" fill="#d9772b" />
          <path d="M130 150 L138 128 Q150 110 162 128 L170 150Z" fill="#a54716" />
          <path d="M230 150 L238 128 Q250 110 262 128 L270 150Z" fill="#a54716" />
          <circle cx="200" cy="62" r="5" fill="#fcc419" />
          <path d="M200 58 L200 30" stroke="#5b2a0c" strokeWidth="2" />
          <path d="M200 30 L224 36 L200 43Z" fill="#f57c00" />
          <path d="M186 200 L186 172 Q200 158 214 172 L214 200Z" fill="#3b1606" />
          {[140, 250].map((x) => <rect key={x} x={x} y="165" width="12" height="18" rx="6" fill="#3b1606" />)}
        </g>
      );
    case 'beach':
      return (
        <g>
          <rect x="0" y="150" width="400" height="40" fill="#1aa3b8" />
          <path d="M0 160 Q40 154 80 160 T160 160 T240 160 T320 160 T400 160" stroke="#bdf0f5" strokeWidth="3" fill="none" opacity=".7" />
          <path d="M0 200 Q120 175 260 186 T400 180 L400 260 L0 260Z" fill="#f6d79c" />
          {[[300, 190, 1], [340, 196, 0.8]].map(([x, y, s]) => (
            <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
              <path d="M0 0 Q6 -50 -6 -96" stroke="#7a4b23" strokeWidth="7" fill="none" strokeLinecap="round" />
              {[-60, -20, 20, 60, 100].map((r) => <path key={r} d="M-6 -96 q30 -14 52 6 q-26 -6 -52 -6z" fill="#2f8f46" transform={`rotate(${r} -6 -96)`} />)}
            </g>
          ))}
        </g>
      );
    case 'hills':
      return (
        <g>
          <path d="M0 160 L70 95 L120 130 L190 70 L260 140 L320 100 L400 150 L400 260 L0 260Z" fill="#3f8f5a" />
          <path d="M0 190 Q100 140 200 175 T400 170 L400 260 L0 260Z" fill="#2c6e43" />
          <rect x="0" y="120" width="400" height="18" fill="#fff" opacity=".35" />
          <path d="M190 70 L205 84 L178 84Z" fill="#e9f5ec" opacity=".6" />
        </g>
      );
    case 'waterfall':
      return (
        <g>
          <path d="M0 260 L0 90 L150 60 L170 260Z" fill="#3e6b4f" />
          <path d="M230 260 L250 70 L400 100 L400 260Z" fill="#3e6b4f" />
          <path d="M150 62 Q160 64 172 62 L190 260 L150 260Z" fill="#e9f6fb" />
          <path d="M158 80 L160 250 M168 80 L174 250" stroke="#bfe3f0" strokeWidth="3" />
          <path d="M120 240 Q200 222 280 240 L280 260 L120 260Z" fill="#cfe8ef" />
          {[[60, 120], [320, 140], [100, 160]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="18" fill="#2c5a3d" />)}
        </g>
      );
    case 'fort':
      return (
        <g>
          <rect x="0" y="170" width="400" height="90" fill="#0f5d78" />
          <path d="M60 186 Q200 150 340 186 L340 196 L60 196Z" fill="#6b4a2e" />
          <path d="M90 186 L90 128 L310 128 L310 186Z" fill="#8b6239" />
          {[90, 140, 190, 240, 290].map((x) => <rect key={x} x={x} y="116" width="20" height="14" fill="#8b6239" />)}
          <path d="M120 128 L120 104 Q135 90 150 104 L150 128Z" fill="#6f4c2b" />
          <path d="M250 128 L250 104 Q265 90 280 104 L280 128Z" fill="#6f4c2b" />
          <path d="M188 186 L188 160 Q200 148 212 160 L212 186Z" fill="#3a2614" />
          <path d="M0 210 Q60 200 120 210 T240 210 T400 210" stroke="#7fd0e6" strokeWidth="2" fill="none" opacity=".6" />
        </g>
      );
    case 'city':
      return (
        <g>
          {[[10, 120, 40], [55, 90, 34], [95, 135, 28], [255, 100, 34], [295, 70, 30], [330, 115, 40], [372, 95, 28]].map(([x, y, w]) => (
            <g key={x}>
              <rect x={x} y={y} width={w} height={260 - y} fill="#0a1834" />
              {Array.from({ length: Math.floor((200 - y) / 18) }).map((_, i) => (
                <rect key={i} x={x + 6} y={y + 10 + i * 18} width={w - 12} height="4" fill="#fcc419" opacity=".55" />
              ))}
            </g>
          ))}
          <path d="M130 200 L130 120 L270 120 L270 200 L232 200 L232 160 Q200 128 168 160 L168 200Z" fill="#f2d4a7" />
          <rect x="124" y="110" width="152" height="12" fill="#e7c08e" />
          {[140, 175, 210, 245].map((x) => <path key={x} d={`M${x} 110 l8 -18 l8 18z`} fill="#e7c08e" />)}
          <rect x="0" y="200" width="400" height="60" fill="#13305e" />
          <path d="M0 214 L400 214" stroke="#ffd866" strokeWidth="2" strokeDasharray="10 12" opacity=".5" />
        </g>
      );
    case 'airport':
      return (
        <g>
          <rect x="0" y="190" width="400" height="70" fill="#5b6b80" />
          <path d="M0 225 L400 225" stroke="#fff" strokeWidth="3" strokeDasharray="22 16" />
          <rect x="300" y="110" width="16" height="80" fill="#e5e9f0" />
          <path d="M288 92 L328 92 L322 112 L294 112Z" fill="#0f2245" />
          <rect x="20" y="160" width="200" height="30" fill="#dfe6ef" />
          <rect x="20" y="164" width="200" height="8" fill="#5aa9e6" />
          <g transform="translate(70 70) rotate(-12)">
            <path d="M0 22 L190 14 Q215 16 218 22 Q215 28 190 30 L0 28Z" fill="#fff" />
            <path d="M80 22 L130 -20 L148 -20 L118 22Z" fill="#dbe4ee" />
            <path d="M80 26 L120 58 L136 58 L112 26Z" fill="#dbe4ee" />
            <path d="M0 22 L-8 -4 L10 -4 L24 20Z" fill="#f57c00" />
            {[150, 160, 170, 180].map((x) => <circle key={x} cx={x} cy="20" r="2.3" fill="#0f2245" />)}
          </g>
        </g>
      );
    case 'office':
      return (
        <g>
          {[[40, 70, 70], [125, 40, 80], [220, 90, 60], [295, 60, 70]].map(([x, y, w]) => (
            <g key={x}>
              <rect x={x} y={y} width={w} height={220 - y} fill="#1e3a6e" />
              {Array.from({ length: Math.floor((210 - y) / 16) }).map((_, i) => (
                <rect key={i} x={x + 6} y={y + 8 + i * 16} width={w - 12} height="8" fill="#8fc1ef" opacity=".6" />
              ))}
            </g>
          ))}
          <rect x="0" y="220" width="400" height="40" fill="#43536b" />
        </g>
      );
    default:
      return null;
  }
}

/* Road with a small car — used for road, family and hero-style scenes */
function RoadWithCar({ color = '#f5f7fb', kind = 'sedan', dark }) {
  return (
    <g>
      <path d="M0 150 L80 108 L150 140 L230 96 L320 130 L400 110 L400 260 L0 260Z" fill={dark ? '#1b2d52' : '#5f8f56'} />
      <path d="M0 200 Q200 170 400 190 L400 260 L0 260Z" fill={dark ? '#0d1b36' : '#3d6b3a'} />
      <path d="M0 214 L400 204 L400 244 L0 256Z" fill="#2a2f3a" />
      <path d="M0 236 L400 224" stroke="#ffd866" strokeWidth="2.5" strokeDasharray="16 14" />
      <CarArt kind={kind} color={color} width="170" height="67" x="115" y="150" />
    </g>
  );
}

const altSkies = [null, ['#e8789a', '#ffd9b8'], ['#4f9fd8', '#fff1cf'], ['#7a5cc2', '#ffc58f']];

export function Scene({ kind = 'road', className = '', label, seed = 0 }) {
  const id = uid(useId());
  const v = Math.abs(seed) % 4;
  const night = kind === 'city' || kind === 'road';
  const [top, bottom] = (!night && altSkies[v]) || skies[kind] || skies.road;
  const sunX = [300, 110, 210, 330][v];
  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={label || `${kind} illustration`}>
      <defs>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill={`url(#s${id})`} />
      <circle cx={kind === 'beach' && v === 0 ? 90 : sunX} cy={night ? 150 : 62 + v * 6} r={night ? 34 : 26} fill={night ? '#ffb35c' : '#fff3c4'} opacity={night ? 0.9 : 1} />
      {!night && (
        <g fill="#fff" opacity=".7">
          <ellipse cx="80" cy="50" rx="34" ry="10" />
          <ellipse cx="230" cy="36" rx="26" ry="8" />
        </g>
      )}
      {kind !== 'city' && kind !== 'office' && kind !== 'airport' && kind !== 'road' && kind !== 'family' && (
        <path d="M0 170 L60 130 L120 155 L190 118 L260 150 L330 122 L400 150 L400 260 L0 260Z" fill="#000" opacity=".12" />
      )}
      {kind === 'road' || kind === 'family' ? (
        <RoadWithCar dark={kind === 'road'} kind={kind === 'family' ? 'mpv' : 'sedan'} color={kind === 'family' ? '#c8ccd4' : '#f5f7fb'} />
      ) : (
        <Subject kind={kind} />
      )}
      {kind === 'temple' && <path d="M0 200 Q200 180 400 200 L400 260 L0 260Z" fill="#c76a22" opacity=".9" />}
    </svg>
  );
}

/* Photo if provided, otherwise illustration */
export function Visual({ photo, scene, alt, className = '', seed = 0 }) {
  if (photo) {
    return <img src={img(photo)} alt={alt} loading="lazy" decoding="async" className={`object-cover ${className}`} />;
  }
  return <Scene kind={scene} label={alt} className={className} seed={seed} />;
}

/* ---------- Hero banner ---------- */
export function HeroScene({ className = '' }) {
  const id = uid(useId());
  return (
    <svg viewBox="0 0 800 520" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`hs${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#06101f" />
          <stop offset=".45" stopColor="#152c56" />
          <stop offset=".8" stopColor="#d96500" />
          <stop offset="1" stopColor="#ffb35c" />
        </linearGradient>
        <radialGradient id={`sun${id}`}>
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset=".5" stopColor="#fcc419" />
          <stop offset="1" stopColor="#f57c00" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="520" fill={`url(#hs${id})`} />
      {Array.from({ length: 46 }).map((_, i) => {
        const r1 = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
        const r2 = Math.abs(Math.sin(i * 78.233) * 12345.6789) % 1;
        return <circle key={i} cx={(r1 * 800).toFixed(1)} cy={(r2 * 230).toFixed(1)} r={i % 3 ? 1 : 1.6} fill="#fff" opacity={0.25 + (i % 4) * 0.12} />;
      })}
      <circle cx="560" cy="350" r="120" fill={`url(#sun${id})`} />
      <circle cx="560" cy="350" r="46" fill="#ffd866" />
      <path d="M0 360 L90 300 L170 340 L260 270 L350 330 L430 290 L520 345 L610 280 L700 330 L800 300 L800 520 L0 520Z" fill="#2a1d3d" opacity=".85" />
      {/* temple silhouette */}
      <g fill="#1a1230" transform="translate(110 250)">
        <path d="M0 110 L0 80 L120 80 L120 110Z" />
        <path d="M30 80 L38 50 Q60 -10 82 50 L90 80Z" />
        <path d="M60 12 L60 -14" stroke="#1a1230" strokeWidth="2" />
        <path d="M60 -14 L78 -9 L60 -4Z" fill="#f57c00" />
      </g>
      {/* city skyline right */}
      <g fill="#120c24">
        {[[640, 300, 26], [670, 270, 22], [694, 310, 30], [728, 285, 24], [756, 320, 44]].map(([x, y, w]) => <rect key={x} x={x} y={y} width={w} height={120} />)}
      </g>
      <path d="M0 420 Q200 370 400 395 T800 380 L800 520 L0 520Z" fill="#0d1b36" />
      <path d="M0 448 L800 420 L800 500 L0 520Z" fill="#1f2430" />
      <path d="M0 486 L800 462" stroke="#ffd866" strokeWidth="3" strokeDasharray="26 20" />
      <g transform="translate(330 352)">
        <g className="motion-safe:animate-drive">
          <CarArt kind="sedan" color="#f5f7fb" width="310" height="122" />
        </g>
      </g>
    </svg>
  );
}
