import Link from 'next/link';

function construirSlug(empresa) {
  const nombreLimpio = (empresa.nombre || empresa.ticker)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${empresa.ticker.toLowerCase()}__${nombreLimpio}`;
}

export default function TopEmpresas({ empresas }) {
  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Empresas más consultadas de la semana</h2>

      {!empresas || empresas.length === 0 ? (
        <p style={{ color: 'var(--v3-text-soft)' }}>
          Aún no hay datos suficientes. Vuelve dentro de unos días.
        </p>
      ) : (
        <ul className="v3-lista">
          {empresas.map((e) => (
            <li key={e.ticker}>
              <Link href={`/analisis/${construirSlug(e)}`}>
                <span>
                  <strong>{e.nombre}</strong>{' '}
                  <span style={{ color: 'var(--v3-text-soft)' }}>({e.ticker})</span>
                  {e.sector && (
                    <span style={{ color: 'var(--v3-text-mute)' }}> · {e.sector}</span>
                  )}
                </span>
                <span style={{ color: 'var(--v3-text-mute)', fontSize: '13px' }}>
                  {e.visitas} {e.visitas === 1 ? 'visita' : 'visitas'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
