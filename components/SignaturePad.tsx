'use client';
// components/SignaturePad.tsx
// A free, dependency-free electronic-signature pad. The landlord draws with a
// finger (touch), stylus or mouse; on every stroke end we export the drawing as
// a PNG data URL via onChange. No third-party e-signature service is used, so
// there is no cost. The parent uploads the PNG to Cloudinary for storage and
// also sends the raw data URL so the API can embed it into the agreement PDF.
import { useRef, useEffect, useCallback, useState } from 'react';

type Props = {
  onChange: (dataUrl: string | null) => void;
  height?: number;
  penColor?: string;
};

export default function SignaturePad({ onChange, height = 180, penColor = '#0f1f3d' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const hasInk = useRef(false);
  const [empty, setEmpty] = useState(true);

  // Size the backing store to the CSS box times the device pixel ratio so the
  // line stays crisp on retina/phone screens, then scale the context to match.
  const setup = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
  }, [penColor]);

  useEffect(() => {
    setup();
    // A resize would otherwise wipe the drawing (canvas clears on resize); we
    // simply reset in that case, which is acceptable for a signature box.
    const onResize = () => { setup(); hasInk.current = false; setEmpty(true); onChange(null); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setup, onChange]);

  const pos = (e: PointerEvent | React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: (e as PointerEvent).clientX - rect.left, y: (e as PointerEvent).clientY - rect.top };
  };

  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    drawing.current = true;
    last.current = pos(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !last.current) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (!hasInk.current) { hasInk.current = true; setEmpty(false); }
  };

  const end = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    try { canvasRef.current?.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    if (hasInk.current && canvasRef.current) onChange(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
    setEmpty(true);
    onChange(null);
  };

  return (
    <div>
      <div
        style={{
          position: 'relative',
          border: '2px dashed #cbd5e1',
          borderRadius: 10,
          background: '#fff',
          touchAction: 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
          style={{ width: '100%', height, display: 'block', borderRadius: 8, cursor: 'crosshair' }}
        />
        {empty && (
          <div
            style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', pointerEvents: 'none', color: '#94a3b8',
              fontSize: 14, fontStyle: 'italic',
            }}
          >
            Sign here with your finger or mouse
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button
          type="button"
          onClick={clear}
          disabled={empty}
          style={{
            background: 'none', border: 'none', color: empty ? '#cbd5e1' : '#dc2626',
            fontWeight: 600, fontSize: 13, cursor: empty ? 'default' : 'pointer',
          }}
        >
          Clear signature
        </button>
      </div>
    </div>
  );
}
