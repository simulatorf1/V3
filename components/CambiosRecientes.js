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

function colorZona(zona) {
  if (zona === 'alta') return 'var(--v3-negative)';
  if (zona === 'baja') return 'var(--v3-positive)';
  return 'var(--v3-text-soft)';
}

export default function CambiosRecientes({ cambios }) {
  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Cambios recientes detectados</h2>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '-4px' }}>
        Análisis actualizados en las últimas 48 horas.
      </p>

      {!cambios || cambios.length === 0 ? (
        <p style={{ color: 'var(--v3-text-soft)' }}>
          Aún no hay cambios registrados en las últimas 48 horas.
        </p>
      ) : (
        <ul className="v3-lista">
          {cambios.slice(0, 10).map((c) => (
            <li key={c.ticker}>
              <Link href={`/analisis/${construirSlug(c)}`}>
                <span>
                  <strong>{c.nombre}</strong>{' '}
                  <span style={{ color: 'var(--v3-text-soft)' }}>({c.ticker})</span>
                </span>
                <span style={{ color: colorZona(c.zona), fontWeight: 700, fontSize: '13px' }}>
                  zona {c.zona}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
