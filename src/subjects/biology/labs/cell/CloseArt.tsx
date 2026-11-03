import type { ReactNode } from 'react';

/** Original schematic drawings on a 720 × 400 stage. Each shows only what its steps need. */

const Fluid = ({ color }: { color: string }) => <rect width="720" height="400" fill={color} />;

function Mito() {
  const fingers = [110, 210, 310, 410, 510, 610];
  return (
    <>
      <Fluid color="#2b3f3d" />
      <rect x="30" y="50" width="660" height="300" rx="150" fill="#e7774d" stroke="#7e2c12" strokeWidth="6" />
      <rect x="50" y="70" width="620" height="260" rx="130" fill="#fbd0b4" stroke="#b34a22" strokeWidth="5" />
      {fingers.map((x, i) => {
        const top = i % 2 === 0;
        const d = top ? `M${x} 72V152` : `M${x} 328V248`;
        return (
          <g key={x}>
            <path d={d} stroke="#b34a22" strokeWidth="26" strokeLinecap="round" />
            <path d={d} stroke="#ef9b72" strokeWidth="11" strokeLinecap="round" />
            {[0, 1, 2, 3].map((k) => <circle key={k} cx={x + 15} cy={top ? 84 + k * 22 : 316 - k * 22} r="4.5" fill="#6d2a10" />)}
          </g>
        );
      })}
      <circle cx="345" cy="200" r="42" fill="none" stroke="#a84522" strokeWidth="6" strokeDasharray="20 8" />
      <text x="345" y="205" textAnchor="middle" className="svg-label svg-label-dark" fontSize="13">ক্রেবস চক্র</text>
      <text x="545" y="240" textAnchor="middle" className="svg-label svg-label-dark" fontSize="13">ইলেকট্রন প্রবাহ</text>
    </>
  );
}

function Chloro() {
  const stack = (x: number, y: number) => (
    <g key={`${x}${y}`}>
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={x - 48} y={y - 42 + i * 14} width="96" height="12" rx="6" fill="#16743b" stroke="#a9e2b5" strokeWidth="1" />)}
    </g>
  );
  return (
    <>
      <Fluid color="#2b3f3d" />
      <ellipse cx="360" cy="200" rx="340" ry="180" fill="#1f7a43" stroke="#0f4d2a" strokeWidth="5" />
      <ellipse cx="360" cy="200" rx="322" ry="162" fill="#c6e6b2" />
      <path d="M200 150V270" stroke="#2c8a4a" strokeWidth="9" />
      {stack(200, 150)}
      {stack(200, 270)}
      <text x="300" y="165" textAnchor="middle" className="svg-label svg-label-dark" fontSize="13">আলোকনির্ভর</text>
      <circle cx="525" cy="200" r="62" fill="none" stroke="#b5402f" strokeWidth="9" strokeDasharray="60 14" />
      <text x="525" y="205" textAnchor="middle" className="svg-label svg-label-dark" fontSize="13">ক্যালভিন চক্র</text>
      <ellipse cx="430" cy="300" rx="26" ry="16" fill="#f6f1da" stroke="#c9c19a" />
    </>
  );
}

function NucleusShell({ children }: { children?: ReactNode }) {
  const pores = Array.from({ length: 14 }, (_, i) => (i / 14) * Math.PI * 2);
  return (
    <>
      <Fluid color="#f3e3bb" />
      <circle cx="350" cy="200" r="186" fill="#6b3fa0" />
      <circle cx="350" cy="200" r="172" fill="#dcc5f1" />
      {pores.map((a) => <circle key={a} cx={350 + Math.cos(a) * 179} cy={200 + Math.sin(a) * 179} r="10" fill="#f3e3bb" stroke="#3a1a66" strokeWidth="2" />)}
      {children}
    </>
  );
}

function Nucleus() {
  const rungs = [260, 290, 320, 350, 380, 410, 440];
  return (
    <NucleusShell>
      <path d="M430 130c40-40 70 10 40 35s-60-5-40-35ZM280 95c20-20 50 0 70-14" fill="none" stroke="#7a4cb0" strokeWidth="5" />
      <circle cx="255" cy="130" r="30" fill="#3f1e6f" />
      <path d="M240 186H460" stroke="#5a3191" strokeWidth="8" />
      <path d="M240 214H460" stroke="#5a3191" strokeWidth="8" />
      {rungs.map((x) => <path key={x} d={`M${x} 190V210`} stroke="#8f62c1" strokeWidth="5" />)}
      <path d="M290 238H430" stroke="#2fb58a" strokeWidth="7" strokeLinecap="round" />
    </NucleusShell>
  );
}

function Nucleolus() {
  return (
    <NucleusShell>
      <circle cx="360" cy="200" r="66" fill="#3f1e6f" />
      <circle cx="340" cy="186" r="16" fill="#8fa8dc" />
      <circle cx="384" cy="214" r="22" fill="#6f8fc4" />
    </NucleusShell>
  );
}

function Ribosome() {
  const letters = 'AUGGCUUUCGAAUAA'.split('');
  return (
    <>
      <Fluid color="#f3e3bb" />
      <path d="M20 262H700" stroke="#2fb58a" strokeWidth="14" strokeLinecap="round" />
      {letters.map((l, i) => (
        <text key={i} x={80 + i * 42} y="267" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0d3d2c">{l}</text>
      ))}
      <path d="M170 225C170 120 490 120 490 225Z" fill="#6f8fc4" stroke="#203a66" strokeWidth="4" />
      <path d="M200 280C210 335 460 335 470 280Z" fill="#8fa8dc" stroke="#203a66" strokeWidth="4" />
      <path d="M330 190L390 175L450 190" fill="none" stroke="#c9472f" strokeWidth="8" strokeLinecap="round" />
    </>
  );
}

const Lumen = ({ y = 165 }: { y?: number }) => (
  <>
    <rect x="-20" y={y} width="760" height="72" rx="30" fill="#bfe2f7" stroke="#2f6fa8" strokeWidth="6" />
  </>
);

function Rer() {
  const dots = Array.from({ length: 9 }, (_, i) => 70 + i * 76);
  return (
    <>
      <Fluid color="#f3e3bb" />
      <Lumen />
      {dots.map((x) => <g key={x}><circle cx={x} cy="150" r="13" fill="#203a66" /><circle cx={x} cy="139" r="8" fill="#3b5a94" /></g>)}
      <path d="M380 200c20-20 40 20 60 0" fill="none" stroke="#c9472f" strokeWidth="8" strokeLinecap="round" />
    </>
  );
}

function Ser() {
  return (
    <>
      <Fluid color="#f3e3bb" />
      <Lumen />
      {[130, 240, 350, 460].map((x) => <circle key={x} cx={x} cy="166" r="9" fill="#2f6fa8" />)}
    </>
  );
}

function Golgi() {
  const sacs = [120, 200, 280, 360, 440];
  return (
    <>
      <Fluid color="#f3e3bb" />
      {sacs.map((x, i) => (
        <path key={x} d={`M${x} 60Q${x + 44} 200 ${x} 340`} fill="none" stroke="#b98a1d" strokeWidth="38" strokeLinecap="round" opacity={0.9 - i * 0.05} />
      ))}
      {sacs.map((x) => <path key={`i${x}`} d={`M${x} 60Q${x + 44} 200 ${x} 340`} fill="none" stroke="#f1d06e" strokeWidth="22" strokeLinecap="round" />)}
      {[[560, 110], [590, 290], [540, 200]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="22" fill="#ecc656" stroke="#a97a14" strokeWidth="3" />)}
    </>
  );
}

function Lyso() {
  return (
    <>
      <Fluid color="#f3e3bb" />
      <circle cx="360" cy="200" r="150" fill="#f7bcd5" stroke="#7b1a50" strokeWidth="8" />
      {[[280, 270], [420, 270], [300, 130], [430, 140], [250, 200], [470, 210]].map(([x, y]) => (
        <path key={x} d={`M${x - 12} ${y}l12 -10l12 10l-12 10Z`} fill="#b93478" />
      ))}
      <ellipse cx="360" cy="200" rx="60" ry="36" fill="#b5e38a" stroke="#4f7a2c" strokeWidth="3" />
    </>
  );
}

function Vacuole() {
  return (
    <>
      <Fluid color="#f6e7ae" />
      <rect x="6" y="6" width="708" height="388" rx="30" fill="none" stroke="#5c9e5c" strokeWidth="12" />
      <ellipse cx="360" cy="200" rx="270" ry="150" fill="#a9dcf0" stroke="#2f7fa8" strokeWidth="6" />
      <ellipse cx="290" cy="130" rx="80" ry="26" fill="#fff" opacity="0.3" />
    </>
  );
}

function Wall() {
  const layers: [number, number, string][] = [[255, 50, '#7da36b'], [305, 26, '#a9d98f'], [345, 30, '#e9c98a'], [375, 26, '#a9d98f'], [401, 50, '#7da36b']];
  return (
    <>
      <Fluid color="#f6e7ae" />
      {layers.map(([x, w, c]) => <rect key={x} x={x} y="0" width={w} height="400" fill={c} stroke="#4d7a44" strokeWidth="1.5" />)}
      <rect x="250" y="300" width="210" height="16" fill="#f6e7ae" />
      <rect x="250" y="120" width="60" height="30" fill="#f6e7ae" />
      <rect x="401" y="120" width="50" height="30" fill="#f6e7ae" />
      <text x="130" y="205" textAnchor="middle" className="svg-label svg-label-dark" fontSize="14">কোষ ১</text>
      <text x="590" y="205" textAnchor="middle" className="svg-label svg-label-dark" fontSize="14">কোষ ২</text>
    </>
  );
}

function Centro() {
  const rays = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);
  const pole = (x: number, dir: number) => (
    <g key={x}>
      {rays.map((a) => <line key={a} x1={x} y1="200" x2={x + Math.cos(a) * 64} y2={200 + Math.sin(a) * 64} stroke="#9fd8cf" strokeWidth="2" />)}
      {[-120, -70, -30, 30, 70, 120].map((k) => <path key={k} d={`M${x} 200Q360 ${200 + k * 1.2} ${x + dir * 260} 200`} stroke="#9fd8cf" strokeWidth="2" fill="none" />)}
      <rect x={x - 16} y="192" width="32" height="16" rx="4" fill="#f7f4e4" stroke="#7a7656" />
      <rect x={x - 8} y="184" width="16" height="32" rx="4" fill="#f7f4e4" stroke="#7a7656" />
    </g>
  );
  return (
    <>
      <Fluid color="#f4dcae" />
      {pole(100, 1)}
      {pole(620, -1)}
      <path d="M345 170L375 230M375 170L345 230" stroke="#4da3ff" strokeWidth="14" strokeLinecap="round" />
      <circle cx="360" cy="200" r="8" fill="#fff4cc" />
    </>
  );
}

function Cytoskel() {
  return (
    <>
      <Fluid color="#f4dcae" />
      {[120, 200, 280].map((y) => <path key={y} d={`M0 ${y}C200 ${y - 30} 500 ${y + 30} 720 ${y}`} fill="none" stroke="#9a7a42" strokeWidth="9" strokeDasharray="14 4" />)}
    </>
  );
}

function Cytoplasm() {
  return (
    <>
      <Fluid color="#f8dfb0" />
      <polygon points="150,160 186,180 186,220 150,240 114,220 114,180" fill="#fff2a8" stroke="#a88a2c" strokeWidth="3" />
      <path d="M195 200H330" stroke="#b78a3d" strokeWidth="4" strokeDasharray="8 6" />
      <circle cx="360" cy="180" r="22" fill="#ffe0b0" stroke="#a88a2c" strokeWidth="3" />
      <circle cx="360" cy="222" r="22" fill="#ffe0b0" stroke="#a88a2c" strokeWidth="3" />
      <path d="M390 200H600" stroke="#b78a3d" strokeWidth="4" strokeDasharray="8 6" />
      <path d="M400 215L500 290" stroke="#b78a3d" strokeWidth="4" strokeDasharray="8 6" />
      <rect x="605" y="130" width="130" height="140" rx="60" fill="#f08a63" stroke="#8f3417" strokeWidth="5" />
      <text x="665" y="205" textAnchor="middle" className="svg-label svg-label-dark" fontSize="12">মাইটোকন্ড্রিয়া</text>
      {[[255, 120], [470, 120], [90, 300], [300, 330]].map(([x, y]) => <path key={x} d={`M${x - 12} ${y}l12 -10l12 10l-12 10Z`} fill="#c98a2e" />)}
    </>
  );
}

function Membrane() {
  const skip = [400, 530];
  const xs = Array.from({ length: 28 }, (_, i) => 12 + i * 26).filter((x) => skip.every((s) => Math.abs(x - s) > 34));
  return (
    <>
      <rect width="720" height="160" fill="#16292c" />
      <rect y="160" width="720" height="240" fill="#f8dfb0" />
      {xs.map((x) => (
        <g key={x}>
          <circle cx={x} cy="165" r="11" fill="#f1cb7c" stroke="#a97a2c" />
          <path d={`M${x - 4} 175V197M${x + 4} 175V197M${x - 4} 203V225M${x + 4} 203V225`} stroke="#d9a94f" strokeWidth="3" />
          <circle cx={x} cy="235" r="11" fill="#f1cb7c" stroke="#a97a2c" />
        </g>
      ))}
      {skip.map((x) => (
        <path key={x} d={`M${x - 28} 145C${x - 40} 190 ${x - 40} 215 ${x - 28} 255H${x - 12}C${x - 22} 215 ${x - 22} 190 ${x - 12} 145ZM${x + 28} 145C${x + 40} 190 ${x + 40} 215 ${x + 28} 255H${x + 12}C${x + 22} 215 ${x + 22} 190 ${x + 12} 145Z`} fill="#a877d6" stroke="#5a3191" strokeWidth="2.5" />
      ))}
      <text x="640" y="30" className="svg-label" fontSize="13">কোষের বাইরে</text>
      <text x="16" y="385" className="svg-label svg-label-dark" fontSize="13">কোষের ভেতরে</text>
    </>
  );
}

function Hb() {
  return (
    <>
      <rect width="720" height="400" fill="#3a1f24" />
      <rect x="0" y="170" width="720" height="60" fill="#7a2c2c" />
      <ellipse cx="90" cy="110" rx="80" ry="70" fill="#e6a3b5" />
      <text x="90" y="115" textAnchor="middle" className="svg-label svg-label-dark" fontSize="13">বায়ুথলি</text>
      <rect x="590" y="40" width="120" height="110" rx="20" fill="#c9926a" />
      <text x="650" y="100" textAnchor="middle" className="svg-label svg-label-dark" fontSize="13">টিস্যু</text>
      {[170, 360, 550].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="200" rx="62" ry="50" fill="#d9463c" stroke="#8e1616" strokeWidth="3" />
          <ellipse cx={x} cy="200" rx="26" ry="20" fill="#e87a6c" />
        </g>
      ))}
    </>
  );
}

export const CLOSE_ART: Record<string, () => ReactNode> = {
  mito: Mito, chloro: Chloro, nucleus: Nucleus, nucleolus: Nucleolus, ribosome: Ribosome, rer: Rer, ser: Ser, golgi: Golgi,
  lyso: Lyso, vacuole: Vacuole, wall: Wall, centro: Centro, cytoskel: Cytoskel, cytoplasm: Cytoplasm, membrane: Membrane, hb: Hb,
};
