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

function situacionDesdeZona(zona) {
  if (zona === 'alta') return 'parte alta del rango';
  if (zona === 'baja') return 'parte baja del rango';
  return 'parte intermedia del rango';
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
          <div
            className="v3-card"
            style={{ padding: '16px', borderLeft: '3px solid #2563eb' }}
          >
            <h3 style={{ marginTop: 0, fontSize: '14px' }}>
              Percentil ≥ 90 · parte alta
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {altos.map((item) => (
                <li key={item.ticker} style={{ marginBottom: '8px' }}>
                  <Link
                    href={`/analisis/${construirSlug(item)}`}
                    style={{ color: 'var(--v3-text)', fontWeight: 600 }}
                  >
                    {item.nombre}
                  </Link>
                  <span style={{ color: 'var(--v3-text-mute)', fontSize: '12px' }}>
                    {' '}
                    · {item.percentil}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hayBajos && (
          <div
            className="v3-card"
            style={{ padding: '16px', borderLeft: '3px solid #9ca3af' }}
          >
            <h3 style={{ marginTop: 0, fontSize: '14px' }}>
              Percentil ≤ 10 · parte baja
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {bajos.map((item) => (
                <li key={item.ticker} style={{ marginBottom: '8px' }}>
                  <Link
                    href={`/analisis/${construirSlug(item)}`}
                    style={{ color: 'var(--v3-text)', fontWeight: 600 }}
                  >
                    {item.nombre}
                  </Link>
                  <span style={{ color: 'var(--v3-text-mute)', fontSize: '12px' }}>
                    {' '}
                    · {item.percentil}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
