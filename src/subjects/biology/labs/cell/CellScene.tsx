import { useEffect, useRef, type ReactNode } from 'react';
import type { CellState, CellType, Env } from './cellSim';
import { isPlasmolysed, PROFILES } from './cellSim';
import { BLOB_OUTLINE, INSIDE, LONG_OUTLINE, layoutFor, type Layout, type Pt } from './layout';
import { ORG } from './organelles';

function Defs() {
  const radial = (id: string, a: string, b: string, cx = '38%', cy = '32%') => (
    <radialGradient id={id} cx={cx} cy={cy} r="78%">
      <stop offset="0" stopColor={a} />
      <stop offset="1" stopColor={b} />
    </radialGradient>
  );
  return (
    <defs>
      {radial('g-cyto', '#fdeccb', '#eec585', '50%', '50%')}
      {radial('g-cyto-p', '#f8f1bf', '#e0d383', '50%', '50%')}
      {radial('g-nuc', '#e0c9f4', '#8f62c1')}
      {radial('g-nucleolus', '#7c4bb5', '#371a63')}
      {radial('g-mito', '#ffb892', '#cf5a33')}
      {radial('g-chl', '#8ad897', '#2a8748')}
      {radial('g-vac', '#dcf3fc', '#86c7e4', '45%', '40%')}
      {radial('g-lyso', '#f9b4d0', '#b93478')}
      {radial('g-wall', '#7fb97a', '#3f7d46', '50%', '50%')}
      <radialGradient id="g-rbc" cx="50%" cy="50%" r="55%">
        <stop offset="0" stopColor="#e87a6c" />
        <stop offset="0.42" stopColor="#d9463c" />
        <stop offset="1" stopColor="#8e1616" />
      </radialGradient>
      <linearGradient id="g-cent" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fbf7e4" />
        <stop offset="1" stopColor="#a8a27c" />
      </linearGradient>
    </defs>
  );
}

const Membrane = ({ d, rect }: { d?: string; rect?: boolean }) => {
  const common = { fill: 'none', pointerEvents: 'stroke' as const };
  const shape = (props: Record<string, unknown>) =>
    rect ? <rect x="32" y="27" width="736" height="506" rx="26" {...common} {...props} /> : <path d={d} {...common} {...props} />;
  return (
    <>
      {shape({ stroke: '#b9832f', strokeWidth: 12 })}
      {shape({ stroke: '#f3d596', strokeWidth: 6 })}
      {shape({ stroke: '#8a5d1c', strokeWidth: 2.5, strokeDasharray: '2 6' })}
    </>
  );
};

const Mito = ({ i, flat }: { i: number; flat: boolean }) => (
  <g transform={`rotate(${flat ? [3, -3, 2, -2][i % 4] : [-22, 18, -8, 34, -40, 6][i % 6]})`}>
    <rect x="-58" y="-28" width="116" height="56" rx="28" fill="url(#g-mito)" stroke="#8f3417" strokeWidth="3.5" />
    <rect x="-52" y="-22" width="104" height="44" rx="22" fill="#f9c4a4" stroke="#a84522" strokeWidth="1.6" />
    <path d="M-44 14V-9Q-37-22-30-8V13Q-23 25-15 10V-13Q-7-24 1-8V13Q9 25 17 10V-13Q25-24 33-8V11Q38 16 42 8" fill="none" stroke="#a84522" strokeWidth="4" strokeLinejoin="round" />
    {[[-37, 8], [-7, -6], [24, 6]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="1.8" fill="#6d2a10" />)}
  </g>
);

const Chloro = ({ i }: { i: number }) => (
  <g transform={`rotate(${[20, -24, 40, -12, 8, 56, -46][i % 7]})`}>
    <ellipse rx="58" ry="30" fill="url(#g-chl)" stroke="#155a31" strokeWidth="3.5" />
    <ellipse rx="52" ry="24" fill="none" stroke="#b7e6bf" strokeWidth="1.4" opacity="0.8" />
    <path d="M-30 0H36" stroke="#135a2f" strokeWidth="2" />
    {[-30, -8, 14, 34].map((x) => (
      <g key={x} fill="#0f5a2e" stroke="#7fd093" strokeWidth="0.7">
        {[-15, -8, -1, 6, 13].map((y) => <rect key={y} x={x - 7} y={y} width="14" height="5.5" rx="2.5" />)}
      </g>
    ))}
    <ellipse cx="42" cy="-6" rx="7" ry="5" fill="#f3efd6" opacity="0.85" />
  </g>
);

const Rer = ({ flip }: { flip: boolean }) => {
  const paths = ['M-46-70Q16-50 12 0T-40 70', 'M-20-74Q44-48 40 0T-14 72', 'M6-70Q72-46 68 0T12 68'];
  return (
    <g transform={flip ? 'scale(1 -1)' : undefined} fill="none" strokeLinecap="round">
      {paths.map((d) => (
        <g key={d}>
          <path d={d} stroke="#1d3460" strokeWidth="17" strokeDasharray="0.5 11" strokeLinecap="round" />
          <path d={d} stroke="#3e7fc2" strokeWidth="11" />
          <path d={d} stroke="#a9d2f2" strokeWidth="4" />
        </g>
      ))}
    </g>
  );
};

const Ser = () => (
  <g fill="none" strokeLinecap="round">
    {['M-48-14q24-24 48 0t48 0', 'M-48 14q24-24 48 0t48 0'].map((d) => (
      <g key={d}>
        <path d={d} stroke="#3f94b8" strokeWidth="10" />
        <path d={d} stroke="#bfe8f5" strokeWidth="4" />
      </g>
    ))}
  </g>
);

const Golgi = () => (
  <g fill="none" strokeLinecap="round">
    {['M-58 44Q0-4 58 44', 'M-54 22Q0-24 54 22', 'M-48 0Q0-42 48 0', 'M-40-22Q0-58 40-22'].map((d) => (
      <g key={d}>
        <path d={d} stroke="#b98a1d" strokeWidth="12" />
        <path d={d} stroke="#f1d06e" strokeWidth="6" />
      </g>
    ))}
    <g fill="#ecc656" stroke="#a97a14" strokeWidth="1.5">
      <circle cx="70" cy="50" r="8" />
      <circle cx="-70" cy="50" r="6" />
      <circle cx="58" cy="-22" r="6" />
      <circle cx="-52" cy="-26" r="5" />
    </g>
  </g>
);

const Lyso = ({ burst }: { burst: boolean }) => (
  <>
    <circle r="23" fill="url(#g-lyso)" stroke="#7b1a50" strokeWidth="3" strokeDasharray={burst ? '6 7' : undefined} />
    {[[-8, -6], [7, -9], [8, 7], [-6, 9], [0, 0]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.8" fill="#6b1544" />)}
  </>
);

const Centro = () => (
  <g stroke="#6f6a4a" strokeWidth="1.5">
    <circle r="32" fill="#fff6d8" fillOpacity="0.45" stroke="none" />
    <rect x="-23" y="-9" width="21" height="31" rx="4" fill="url(#g-cent)" transform="rotate(-20)" />
    <rect x="5" y="-17" width="31" height="21" rx="4" fill="url(#g-cent)" transform="rotate(24)" />
  </g>
);

interface SceneProps {
  type: CellType;
  sim: CellState;
  env: Env;
  off: ReadonlySet<string>;
  selected: string | null;
  onPick: (id: string) => void;
  /** Extra SVG drawn above the cell, such as a process marker. */
  children?: ReactNode;
}

const CHROMATIN = 'M-58-18C-40-48-8-26 6-40S46-30 40-8 64 26 34 30 12 54-8 42-42 54-44 28-70 6-58-18ZM-30 8C-12-14 8 8 24-8M-20-26C-4-10 16-30 30-14';

export function CellArt({ type, sim, off, selected, onPick }: Omit<SceneProps, 'env' | 'children'>) {
  const L = layoutFor(type);
  const profile = PROFILES[type];

  const cls = (id: string) =>
    ['part', selected && selected !== id ? 'dim' : '', selected === id ? 'selected' : '', off.has(id) ? 'off' : ''].join(' ');

  const part = (id: string, key: string, children: ReactNode, transform?: string) => (
    <g
      key={key}
      className={cls(id)}
      transform={transform}
      role="button"
      tabIndex={0}
      aria-label={ORG[id].name}
      onClick={(e) => {
        e.stopPropagation();
        onPick(id);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPick(id);
        }
      }}
    >
      {children}
    </g>
  );

  const at = ([x, y]: Pt) => `translate(${x} ${y})`;
  const burst = sim.cause === 'burst' || sim.cause === 'membrane';
  const plasmolysed = isPlasmolysed(profile, sim);

  // Volume drives the drawn area, so the scale is the square root of the water level.
  const swell = Math.sqrt(Math.max(0.4, sim.water));
  const inner = L.shape === 'box' ? Math.min(1, swell) : swell;

  const interior = (
    <>
      {L.bigVac &&
        part(
          'vacuole', 'vac',
          <>
            <ellipse cx={L.bigVac.x} cy={L.bigVac.y} rx={L.bigVac.rx} ry={L.bigVac.ry * (off.has('vacuole') ? 0.72 : 1)} fill="url(#g-vac)" stroke="#2f7fa8" strokeWidth="4" style={{ transition: 'all .6s' }} />
            <ellipse cx={L.bigVac.x - 60} cy={L.bigVac.y - 60} rx="70" ry="30" fill="#fff" opacity="0.25" />
          </>,
        )}
      {L.smallVac.map((p, i) => part('vacuole', `sv${i}`, <ellipse rx="42" ry="30" fill="url(#g-vac)" stroke="#2f7fa8" strokeWidth="3" />, at(p)))}
      <g fill="none" stroke="#9a7a42" strokeWidth="1.4" opacity="0.5">
        {part('cytoskel', 'fib', L.fibres.map((d) => <path key={d} d={d} pointerEvents="stroke" />))}
      </g>
      {L.nucleus && (
        <>
          {part(
            'nucleus', 'nuc',
            <>
              <circle r="92" fill="url(#g-nuc)" />
              <circle r="92" fill="none" stroke="#54298a" strokeWidth="5" strokeDasharray="30 5" />
              <circle r="84" fill="none" stroke="#7a4cb0" strokeWidth="1.6" />
              <path d={CHROMATIN} fill="#6d41a3" fillOpacity="0.28" stroke="#5a3191" strokeWidth="2" transform="scale(1.1)" />
            </>,
            `${at(L.nucleus)} scale(${L.nucleusScale})`,
          )}
          {part('nucleolus', 'nucleolus', <circle r={24 * L.nucleusScale} fill="url(#g-nucleolus)" />, `translate(${L.nucleus[0] + 18 * L.nucleusScale} ${L.nucleus[1] + 10 * L.nucleusScale})`)}
        </>
      )}
      {L.rer.map((p, i) => part('rer', `rer${i}`, <Rer flip={i % 2 === 1} />, at(p)))}
      {L.ser.map((p, i) => part('ser', `ser${i}`, <Ser />, at(p)))}
      {L.golgi.map((p, i) => part('golgi', `gol${i}`, <Golgi />, at(p)))}
      {L.mito.map((p, i) => part('mito', `mito${i}`, <Mito i={i} flat={L.mitoFlat} />, at(p)))}
      {L.chloro.map((p, i) => part('chloro', `chl${i}`, <Chloro i={i} />, at(p)))}
      {L.lyso.map((p, i) => part('lyso', `lyso${i}`, <Lyso burst={sim.ruptured} />, at(p)))}
      {L.centro && part('centro', 'centro', <Centro />, at(L.centro))}
      {L.ribosomes.map((p, i) =>
        part('ribosome', `rib${i}`, <><circle r="14" fill="transparent" /><circle r="6" fill="#203a66" /><circle cx="-2" cy="-2" r="2" fill="#6f8fc4" /></>, at(p)),
      )}
    </>
  );

  const outline =
    L.shape === 'blob' ? BLOB_OUTLINE : L.shape === 'long' ? LONG_OUTLINE : undefined;

  const protoplast = (
    <g style={{ transformOrigin: '400px 280px', transform: `scale(${burst ? inner * 1.08 : inner})`, transition: 'transform .3s linear', opacity: burst ? 0.28 : 1 }}>
      {L.shape === 'box' ? (
        <>
          {part('cytoplasm', 'cyto', <rect x="32" y="27" width="736" height="506" rx="26" fill="url(#g-cyto-p)" />)}
          {interior}
          {part('membrane', 'mem', <Membrane rect />)}
        </>
      ) : (
        <>
          {part('cytoplasm', 'cyto', <path d={outline} fill="url(#g-cyto)" />)}
          {interior}
          {part('membrane', 'mem', <Membrane d={outline} />)}
        </>
      )}
    </g>
  );

  if (L.shape === 'disc') {
    return (
      <g style={{ transformOrigin: '400px 280px', transform: `scale(${burst ? swell * 1.08 : swell})`, transition: 'transform .3s linear', opacity: burst ? 0.28 : 1 }}>
        {part('hb', 'hb', <ellipse cx="400" cy="280" rx="300" ry="238" fill="url(#g-rbc)" />)}
        {part('membrane', 'mem', <Membrane d="M100 280A300 238 0 1 1 700 280A300 238 0 1 1 100 280Z" />)}
      </g>
    );
  }

  return (
    <>
      {L.shape === 'box' && (
        part('wall', 'wall', <><rect x="10" y="6" width="780" height="548" rx="36" fill="url(#g-wall)" stroke="#2c5f35" strokeWidth="5" /><rect x="24" y="19" width="752" height="522" rx="29" fill={plasmolysed ? '#cfe7ee' : 'none'} stroke="#5d9659" strokeWidth="2" style={{ transition: 'fill .5s' }} /></>)
      )}
      {protoplast}
    </>
  );
}

interface Particle {
  x: number;
  y: number;
  tx: number;
  ty: number;
  life: number;
  speed: number;
  color: string;
  r: number;
}

/**
 * Moving molecules are painted on a canvas above the SVG. Tens of animated SVG nodes are
 * slow on the low-cost phones this site targets, and a canvas keeps that cost flat.
 */
export function ParticleLayer({ type, sim, env, off }: Pick<SceneProps, 'type' | 'sim' | 'env' | 'off'>) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef({ type, sim, env, off });
  live.current = { type, sim, env, off };

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const particles: Particle[] = [];
    let lastType = live.current.type;
    let frame = 0;
    let raf = 0;

    const spawn = (L: Layout, s: CellState, e: Env, o: ReadonlySet<string>) => {
      const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
      const push = (from: Pt, to: Pt, color: string, r: number, speed: number) =>
        particles.push({ x: from[0], y: from[1], tx: to[0], ty: to[1], life: 1, speed, color, r });

      const centre: Pt = L.nucleus ?? [400, 280];
      const edge = (): Pt => {
        const a = Math.random() * Math.PI * 2;
        const [rx, ry] = L.shape === 'long' ? [320, 128] : L.shape === 'disc' ? [285, 222] : [345, 235];
        return [400 + Math.cos(a) * rx, 280 + Math.sin(a) * ry];
      };

      if (L.mito.length && !o.has('mito') && Math.random() < s.atp * 0.45) {
        const start = pick(L.mito);
        const target = L.rer.length && Math.random() < 0.5 ? pick(L.rer) : centre;
        push(start, target, '#ffc23d', 3.2, 2.2);
      }
      if (e.oxygen && L.mito.length && Math.random() < 0.18) push(edge(), pick(L.mito), '#bdeeff', 2.6, 2);
      if (e.glucose && Math.random() < 0.14) push(edge(), L.mito.length ? pick(L.mito) : centre, '#fff2a8', 3, 1.7);
      if (L.rer.length && L.golgi.length && !o.has('rer') && Math.random() < s.secretion * 0.16) push(pick(L.rer), pick(L.golgi), '#ffe08a', 4.5, 1.5);
      if (L.golgi.length && !o.has('golgi') && Math.random() < s.secretion * 0.14) push(pick(L.golgi), edge(), '#f1d06e', 5, 1.5);
      if (L.chloro.length && e.light && !o.has('chloro') && Math.random() < 0.2) push(pick(L.chloro), L.mito.length ? pick(L.mito) : centre, '#9fe8ae', 3, 1.6);
    };

    const tick = () => {
      const { type: currentType, sim: s, env: e, off: o } = live.current;
      const L = layoutFor(currentType);
      ctx.clearRect(0, 0, 800, 560);

      // Molecules in flight belong to the previous cell's shape.
      if (currentType !== lastType) {
        particles.length = 0;
        lastType = currentType;
      }

      if (!s.dead && particles.length < 90 && frame % 3 === 0) spawn(L, s, e, o);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        const d = Math.hypot(dx, dy);
        if (d < 8) {
          particles.splice(i, 1);
          continue;
        }
        p.x += (dx / d) * p.speed + Math.sin((frame + i * 13) / 9) * 0.7;
        p.y += (dy / d) * p.speed + Math.cos((frame + i * 7) / 11) * 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(40,30,10,.55)';
        ctx.stroke();
      }

      // Waste sits where it collects, so a clogged cell is visible at a glance.
      const lumps = Math.floor(s.waste * 40);
      ctx.fillStyle = 'rgba(70,60,50,.62)';
      for (let i = 0; i < lumps; i++) {
        const x = 100 + ((i * 197) % 600);
        const y = 90 + ((i * 131) % 380);
        if (!INSIDE[L.shape](x, y)) continue;
        ctx.beginPath();
        ctx.arc(x, y, 5 + (i % 3) * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      frame += 1;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvas} width={800} height={560} className="cell-canvas" aria-hidden="true" />;
}

export function CellScene({ type, sim, env, off, selected, onPick, children }: SceneProps) {
  return (
    <div className={sim.dead ? 'cell-stage cell-dead' : 'cell-stage'}>
      <svg viewBox="0 0 800 560" role="group" aria-label={PROFILES[type].name}>
        <Defs />
        <CellArt type={type} sim={sim} off={off} selected={selected} onPick={onPick} />
        {children}
      </svg>
      <ParticleLayer type={type} sim={sim} env={env} off={off} />
    </div>
  );
}
