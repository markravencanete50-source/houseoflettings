// components/property/LetAgreedRibbon.tsx
// Status band overlaid across a property's cover image (default red "LET AGREED",
// or e.g. orange "UNDER OFFER" for pending). Purely an overlay
// (pointer-events: none) so it never blocks clicks on the image/gallery beneath.
export default function LetAgreedRibbon({
  fontSize = 18,
  label = 'Let Agreed',
  color = 'var(--red)',
}: { fontSize?: number; label?: string; color?: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 4,
      }}
    >
      <div
        style={{
          width: '100%',
          background: color,
          color: '#fff',
          textAlign: 'center',
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 800,
          fontSize,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '10px 8px',
          boxShadow: '0 6px 22px rgba(0,0,0,0.35)',
        }}
      >
        {label}
      </div>
    </div>
  );
}
