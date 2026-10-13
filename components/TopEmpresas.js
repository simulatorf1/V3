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
  if (!empresas || empresas.length === 0) {
    return (
      <div style={{ marginTop: '40px' }}>
        <h2>Empresas más consultadas de la semana</h2>
        <p style={{ color: '#666' }}>
          Aún no hay datos suficientes. Vuelve dentro de unos días.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '40px' }}>
      <h2>Empresas más consultadas de la semana</h2>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '8px' }}>
        {empresas.map((e) => (
          <li key={e.ticker}>
            <Link
              href={`/analisis/${construirSlug(e)}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                border: '1px solid #eee',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#111'
              }}
            >
              <span>
                <strong>{e.nombre}</strong>{' '}
                <span style={{ color: '#666' }}>({e.ticker})</span>
                {e.sector && (
                  <span style={{ color: '#999', fontSize: '13px' }}> · {e.sector}</span>
                )}
              </span>
              <span style={{ color: '#666', fontSize: '13px' }}>
                {e.visitas} {e.visitas === 1 ? 'visita' : 'visitas'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
