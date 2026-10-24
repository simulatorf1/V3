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
  if (cat === 'A') return 'parte alta del rango';
  if (cat === 'C') return 'parte baja del rango';
  return 'parte intermedia del rango';
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
        Empresas que han cambiado de zona (alta, intermedia o baja) respecto a la sesión anterior.
        Dato descriptivo.
      </p>

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '12px 0 0 0',
          display: 'grid',
          gap: '8px'
        }}
      >
        {cambios.map((c) => (
          <li key={c.ticker}>
            <Link
              href={`/analisis/${construirSlug(c)}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: '#fff',
                border: '1px solid var(--v3-border)',
                borderRadius: 'var(--v3-radius-sm)',
                textDecoration: 'none',
                color: 'var(--v3-text)'
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>
                  {c.nombre}
                </div>
                <div style={{ color: 'var(--v3-text-soft)', fontSize: '12px' }}>
                  {c.ticker}
                  {c.sector && ` · ${c.sector}`}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--v3-text-soft)', textAlign: 'right' }}>
                <div>Antes: {situacionDesdeCategoria(c.categoriaAnterior)}</div>
                <div>Ahora: {situacionDesdeCategoria(c.categoriaNueva)}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
