import Link from 'next/link';

function construirSlug(item) {
  const nombreLimpio = (item.nombre || item.ticker)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${item.ticker.toLowerCase()}__${nombreLimpio}`;
}

function colorDesdeZona(zona) {
  if (zona === 'alta') return '#2563eb';
  if (zona === 'baja') return '#9ca3af';
  return '#e5e7eb';
}

export default function MapaCalorSector({ items, sector }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Mapa de calor · {sector}</h2>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '-4px' }}>
        Cada celda es una empresa del sector. El color indica la zona en la que se encuentra
        dentro de su rango de 60 sesiones. Azul = parte alta, gris = parte baja, claro = intermedia.
        Dato descriptivo.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
          gap: '8px',
          marginTop: '12px'
        }}
      >
        {items.map((item) => (
          <Link
            key={item.ticker}
            href={`/analisis/${construirSlug(item)}`}
            style={{
              display: 'block',
              padding: '10px',
              borderRadius: 'var(--v3-radius-sm)',
              background: colorDesdeZona(item.zona),
              color: item.zona === 'intermedia' ? 'var(--v3-text)' : '#fff',
              textDecoration: 'none',
              fontSize: '12px',
              minHeight: '60px'
            }}
          >
            <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{item.nombre}</div>
            <div style={{ opacity: 0.85, marginTop: '2px' }}>{item.ticker}</div>
          </Link>
        ))}
      </div>

      <p style={{ color: 'var(--v3-text-mute)', fontSize: '12px', marginTop: '8px' }}>
        El color indica posición en el rango, no valoración.
      </p>
    </section>
  );
}
