'use client';

const ZONAS = [
  { key: 'muy-debil', label: 'Muy débil', desde: -100, hasta: -60, color: '#9ca3af' },
  { key: 'debil', label: 'Débil', desde: -60, hasta: -20, color: '#cbd5e1' },
  { key: 'neutral', label: 'Neutral', desde: -20, hasta: 20, color: '#e5e7eb' },
  { key: 'fuerte', label: 'Fuerte', desde: 20, hasta: 60, color: '#93c5fd' },
  { key: 'muy-fuerte', label: 'Muy fuerte', desde: 60, hasta: 100, color: '#2563eb' }
];

export default function BarraIndicadorVisual({ valor }) {
  if (valor === null || valor === undefined) return null;
  const v = Math.max(-100, Math.min(100, valor));
  const posPct = ((v + 100) / 200) * 100;

  const zonaActual = ZONAS.find((z) => v >= z.desde && v < z.hasta) || ZONAS[2];

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ position: 'relative', height: '12px', display: 'flex', borderRadius: '999px', overflow: 'hidden' }}>
        {ZONAS.map((z) => (
          <div
            key={z.key}
            style={{
              flex: (z.hasta - z.desde) / 200,
              background: z.color
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            left: `${posPct}%`,
            top: '-2px',
            bottom: '-2px',
            width: '3px',
            background: '#111',
            transform: 'translateX(-50%)',
            borderRadius: '2px'
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: 'var(--v3-text-mute)',
          marginTop: '2px'
        }}
      >
        <span>-100</span>
        <span style={{ fontWeight: 700, color: 'var(--v3-text)' }}>
          {v.toFixed(0)} · {zonaActual.label}
        </span>
        <span>+100</span>
      </div>
    </div>
  );
}
