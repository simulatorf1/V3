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

function Bloque({ titulo, items, color }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="v3-card" style={{ padding: '16px' }}>
      <h3
        style={{
          margin: '0 0 12px 0',
          fontSize: '13px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color
        }}
      >
        {titulo}
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '8px'
        }}
      >
        {items.map((item) => (
          <Link
            key={item.ticker}
            href={`/analisis/${construirSlug(item)}`}
            style={{
              display: 'block',
              padding: '10px 12px',
              background: '#fff',
              border: '1px solid var(--v3-border)',
              borderRadius: 'var(--v3-radius-sm)',
              textDecoration: 'none',
              color: 'var(--v3-text)'
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: '13px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {item.nombre}
            </div>
            <div style={{ color: 'var(--v3-text-mute)', fontSize: '11px', marginTop: '2px' }}>
              {item.ticker}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginTop: '8px'
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 700 }}>P{item.percentil}</span>
              <span
                className="v3-zona-tag v3-zona-alta"
                style={{ fontSize: '10px' }}
              >
                {item.percentil >= 90 ? 'alta' : 'baja'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ListaExtremos({ altos, bajos }) {
  const hayAltos = altos && altos.length > 0;
  const hayBajos = bajos && bajos.length > 0;

  if (!hayAltos && !hayBajos) {
    return (
      <section className="v3-seccion">
        <h2 className="v3-seccion-titulo">Radar de extremos</h2>
        <p style={{ color: 'var(--v3-text-soft)' }}>
          Ahora mismo ninguna empresa está en el 10% más alto o más bajo de su rango de 60
          sesiones.
        </p>
      </section>
    );
  }

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Radar de extremos</h2>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '-4px' }}>
        Empresas en el 10% más alto o más bajo de su rango de 60 sesiones. Dato descriptivo,
        cambia a diario.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginTop: '12px'
        }}
      >
        {hayAltos && (
          <Bloque titulo="Percentil ≥ 90 · parte alta" items={altos} color="#1e3a8a" />
        )}
        {hayBajos && (
          <Bloque titulo="Percentil ≤ 10 · parte baja" items={bajos} color="#374151" />
        )}
      </div>
    </section>
  );
}
