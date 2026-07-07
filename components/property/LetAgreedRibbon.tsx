// components/property/LetAgreedRibbon.tsx
// Red "LET AGREED" band overlaid across a property's cover image. Purely an
// overlay (pointer-events: none) so it never blocks clicks on the image/gallery
// beneath it. Rendered by the caller only when property.letAgreed is true.
export default function LetAgreedRibbon({ fontSize = 18 }: { fontSize?: number }) {
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
          background: 'var(--red)',
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
        Let Agreed
      </div>
    </div>
  );
}
