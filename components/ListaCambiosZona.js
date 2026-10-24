import Link from 'next/link';

function construirSlug(cambio) {
  const nombreLimpio = (cambio.nombre || cambio.ticker)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${cambio.ticker.toLowerCase()}__${nombreLimpio}`;
}

function situacionDesdeCategoria(cat) {
  if (cat === 'A') return 'parte alta';
  if (cat === 'C') return 'parte baja';
  return 'parte intermedia';
}

export default function ListaCambiosZona({ cambios }) {
  if (!cambios || cambios.length === 0) {
    return (
      <section className="v3-seccion">
        <h2 className="v3-seccion-titulo">Cambios de zona de hoy</h2>
        <p style={{ color: 'var(--v3-text-soft)' }}>
          Ninguna empresa ha cambiado de zona en las últimas 24 horas.
        </p>
      </section>
    );
  }

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Cambios de zona de hoy</h2>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '-4px' }}>
        Empresas que han cambiado de zona respecto a la sesión anterior. Dato descriptivo.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '10px',
          marginTop: '12px'
        }}
      >
        {cambios.map((c) => (
          <Link
            key={c.ticker}
            href={`/analisis/${construirSlug(c)}`}
            style={{
              display: 'block',
              padding: '12px 14px',
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
                fontSize: '14px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {c.nombre}
            </div>
            <div style={{ color: 'var(--v3-text-soft)', fontSize: '11px', marginTop: '2px' }}>
              {c.ticker}
              {c.sector && ` · ${c.sector}`}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--v3-text-mute)', marginTop: '6px' }}>
              Antes: {situacionDesdeCategoria(c.categoriaAnterior)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--v3-text)', fontWeight: 600 }}>
              Ahora: {situacionDesdeCategoria(c.categoriaNueva)}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
