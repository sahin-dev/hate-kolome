import { useEffect, useRef, useState } from 'react';
import { along, mix } from '../paint/paint';
import { H, STOP_ORGANS, W, gutLayers, type GutLayers } from './gut';

const LABELS: { text: string; at: [number, number]; to: [number, number]; side: 'l' | 'r' }[] = [
  { text: 'লালাগ্রন্থি', at: [96, 118], to: [246, 118], side: 'l' },
  { text: 'অন্ননালি', at: [544, 214], to: [326, 214], side: 'r' },
  { text: 'যকৃৎ', at: [76, 352], to: [160, 352], side: 'l' },
  { text: 'পিত্তথলি', at: [76, 440], to: [254, 440], side: 'l' },
  { text: 'পাকস্থলী', at: [572, 398], to: [448, 398], side: 'r' },
  { text: 'অগ্ন্যাশয়', at: [572, 472], to: [452, 472], side: 'r' },
  { text: 'বৃহদন্ত্র', at: [572, 610], to: [504, 610], side: 'r' },
  { text: 'ক্ষুদ্রান্ত্র', at: [76, 650], to: [232, 650], side: 'l' },
];

/** The body in cut-away view. The bolus travels the real path; the current organ stays lit. */
export function GutView({ stop, name }: { stop: number; name: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [gut, setGut] = useState<GutLayers | null>(null);
  const live = useRef({ stop, k: 0 });
  live.current.stop = stop;

  useEffect(() => {
    let on = true;
    gutLayers().then((g) => on && setGut(g));
    return () => {
      on = false;
    };
  }, []);

  useEffect(() => {
    const c = canvas.current?.getContext('2d');
    if (!c || !gut) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let dim = 0;
    let last = -1;

    const frame = (t: number) => {
      const target = gut.stops[live.current.stop];
      const state = live.current;
      state.k = still ? target : mix(state.k, target, 0.035);
      if (last !== live.current.stop) {
        last = live.current.stop;
        dim = 0;
      }
      dim = Math.min(1, dim + 0.05);

      c.clearRect(0, 0, W, H);
      c.drawImage(gut.base, 0, 0);
      c.fillStyle = `rgba(6,14,16,${0.56 * dim})`;
      c.fillRect(0, 0, W, H);
      for (const id of STOP_ORGANS[live.current.stop]) c.drawImage(gut.organs[id], 0, 0);

      const [x, y] = along(gut.path, state.k);
      const pulse = 1 + Math.sin(t / 240) * 0.1;
      const glow = c.createRadialGradient(x, y, 2, x, y, 30 * pulse);
      glow.addColorStop(0, 'rgba(255,214,120,.95)');
      glow.addColorStop(0.35, 'rgba(255,190,80,.55)');
      glow.addColorStop(1, 'rgba(255,190,80,0)');
      c.fillStyle = glow;
      c.beginPath();
      c.arc(x, y, 30 * pulse, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#fff4cf';
      c.beginPath();
      c.arc(x, y, 6, 0, Math.PI * 2);
      c.fill();

      c.font = '600 19px "Hind Siliguri", sans-serif';
      c.lineWidth = 1.2;
      for (const l of LABELS) {
        c.strokeStyle = 'rgba(232,242,236,.55)';
        c.beginPath();
        c.moveTo(l.at[0] + (l.side === 'l' ? 40 : -40), l.at[1]);
        c.lineTo(l.to[0], l.to[1]);
        c.stroke();
        c.fillStyle = '#eef6f0';
        c.textAlign = l.side === 'l' ? 'right' : 'left';
        c.fillText(l.text, l.at[0] + (l.side === 'l' ? 38 : -38), l.at[1] - 6);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [gut]);

  return (
    <div className="gut-view">
      <canvas ref={canvas} width={W} height={H} role="img" aria-label={`মানব পরিপাকতন্ত্র; খাবার এখন ${name}`} />
      {!gut && <span className="render-wait">ছবি তৈরি হচ্ছে…</span>}
    </div>
  );
}
