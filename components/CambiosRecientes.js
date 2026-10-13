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
  if (zona === 'alta') return '#c62828';
  if (zona === 'baja') return '#2e7d32';
  return '#616161';
}

export default function CambiosRecientes({ cambios }) {
  if (!cambios || cambios.length === 0) {
    return (
      <div style={{ marginTop: '40px' }}>
        <h2>Cambios recientes detectados</h2>
        <p style={{ color: '#666' }}>
          Aún no hay cambios registrados en las últimas 48 horas.
        </p>
      </div>
    );
  }

  // Mostramos hasta 10
  const lista = cambios.slice(0, 10);

  return (
    <div style={{ marginTop: '40px' }}>
      <h2>Cambios recientes detectados</h2>
      <p style={{ color: '#666', fontSize: '13px', marginTop: '-8px' }}>
        Análisis actualizados en las últimas 48 horas.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '12px', display: 'grid', gap: '8px' }}>
        {lista.map((c) => (
          <li key={c.ticker}>
            <Link
              href={`/analisis/${construirSlug(c)}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                border: '1px solid #eee',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#111',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <span>
                <strong>{c.nombre}</strong>{' '}
                <span style={{ color: '#666' }}>({c.ticker})</span>
              </span>
              <span style={{ color: colorZona(c.zona), fontWeight: 'bold', fontSize: '13px' }}>
                zona {c.zona}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
