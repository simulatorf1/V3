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
  if (zona === 'alta') return { bg: '#fde8e8', text: '#c62828', border: '#f5c2c2' };
  if (zona === 'baja') return { bg: '#e6f4ea', text: '#1a7f37', border: '#b8dfc4' };
  return { bg: '#f0f2f5', text: '#56606c', border: '#d8dce2' };
}

function fechaCorta(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '12px',
            marginTop: '16px'
          }}
        >
          {cambios.slice(0, 12).map((c) => {
            const cz = colorZona(c.zona);
            return (
              <Link
                key={c.ticker}
                href={`/analisis/${construirSlug(c)}`}
                style={{
                  display: 'block',
                  padding: '16px',
                  border: '1px solid var(--v3-border)',
                  borderRadius: 'var(--v3-radius-sm)',
                  textDecoration: 'none',
                  color: 'var(--v3-text)',
                  background: '#fff',
                  transition: 'border 0.15s ease'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '15px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {c.nombre}
                    </div>
                    <div
                      style={{
                        color: 'var(--v3-text-soft)',
                        fontSize: '12px',
                        marginTop: '2px'
                      }}
                    >
                      {c.ticker}
                      {c.sector && ` · ${c.sector}`}
                    </div>
                  </div>

                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: cz.bg,
                      color: cz.text,
                      border: `1px solid ${cz.border}`,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {c.zona}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline'
                  }}
                >
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: 'var(--v3-text)'
                    }}
                  >
                    {c.precio !== undefined && c.precio !== null
                      ? Number(c.precio).toFixed(2)
                      : '—'}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--v3-text-mute)'
                    }}
                  >
                    {fechaCorta(c.actualizado_at)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
