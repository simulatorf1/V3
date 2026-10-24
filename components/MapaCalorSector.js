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

function colorDesdePercentil(percentil) {
  if (percentil === null || percentil === undefined) return '#e5e7eb';
  if (percentil >= 90) return '#1e3a8a'; // azul muy oscuro
  if (percentil >= 70) return '#2563eb'; // azul medio
  if (percentil >= 50) return '#60a5fa'; // azul claro
  if (percentil >= 30) return '#bfdbfe'; // azul muy claro
  if (percentil >= 10) return '#e5e7eb'; // gris claro
  return '#9ca3af'; // gris
}

function colorTexto(percentil) {
  if (percentil === null || percentil === undefined) return 'var(--v3-text)';
  if (percentil >= 50) return '#fff';
  return 'var(--v3-text)';
}

export default function MapaCalorSector({ items, sector }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Mapa de calor · {sector}</h2>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '-4px' }}>
        Cada celda es una empresa del sector. El color indica su percentil dentro del rango de 60
        sesiones: azul oscuro = percentil más alto, gris = percentil más bajo. Dato descriptivo.
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
              background: colorDesdePercentil(item.percentil),
              color: colorTexto(item.percentil),
              textDecoration: 'none',
              fontSize: '12px',
              minHeight: '60px'
            }}
          >
            <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{item.nombre}</div>
            <div style={{ opacity: 0.85, marginTop: '2px' }}>{item.ticker}</div>
            {item.percentil !== null && item.percentil !== undefined && (
              <div style={{ opacity: 0.9, marginTop: '2px', fontSize: '11px' }}>
                P{item.percentil}
              </div>
            )}
          </Link>
        ))}
      </div>

      <p style={{ color: 'var(--v3-text-mute)', fontSize: '12px', marginTop: '8px' }}>
        El color indica posición en el rango, no valoración.
      </p>
    </section>
  );
}
