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

export default function CambiosRecientes({ cambios }) {
  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Últimas empresas buscadas</h2>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '-4px' }}>
        Análisis actualizados en las últimas 48 horas.
      </p>

      {!cambios || cambios.length === 0 ? (
        <p style={{ color: 'var(--v3-text-soft)' }}>
          Aún no hay empresas buscadas en las últimas 48 horas. Prueba a buscar cualquier empresa
          en el buscador de arriba.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '12px',
            marginTop: '16px'
          }}
        >
          {cambios.slice(0, 12).map((c) => {
            const stats = c.stats || {};

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
                  background: '#fff'
                }}
              >
                <div style={{ marginBottom: '10px' }}>
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

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    paddingBottom: '10px',
                    marginBottom: '10px',
                    borderBottom: '1px solid var(--v3-border)'
                  }}
                >
                  <span
                    style={{
                      color: 'var(--v3-text-mute)',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: 600
                    }}
                  >
                    Último precio
                  </span>
                  <span
                    style={{
                      fontSize: '20px',
                      fontWeight: 800,
                      color: 'var(--v3-text)'
                    }}
                  >
                    {c.precio !== undefined && c.precio !== null
                      ? Number(c.precio).toFixed(2)
                      : '—'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}
                >
                  {stats.compras && stats.compras.muestra > 0 && (
                    <div style={{ flex: 1, minWidth: '100px' }}>
                      <div
                        style={{
                          color: 'var(--v3-text-mute)',
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontWeight: 600
                        }}
                      >
                        Acierto compras
                      </div>
                      <div
                        style={{
                          fontSize: '18px',
                          fontWeight: 800,
                          color:
                            stats.compras.porcentajeAcierto >= 50
                              ? 'var(--v3-positive)'
                              : 'var(--v3-negative)'
                        }}
                      >
                        {stats.compras.porcentajeAcierto.toFixed(1)}%
                      </div>
                    </div>
                  )}
                  {stats.ventas && stats.ventas.muestra > 0 && (
                    <div style={{ flex: 1, minWidth: '100px' }}>
                      <div
                        style={{
                          color: 'var(--v3-text-mute)',
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontWeight: 600
                        }}
                      >
                        Acierto ventas
                      </div>
                      <div
                        style={{
                          fontSize: '18px',
                          fontWeight: 800,
                          color:
                            stats.ventas.porcentajeAcierto >= 50
                              ? 'var(--v3-positive)'
                              : 'var(--v3-negative)'
                        }}
                      >
                        {stats.ventas.porcentajeAcierto.toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
