export default function TablaSenales({ senales, precioActual }) {
  if (!senales) return null;

  const lista = [...senales].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));

  const filas = lista.map((s, i) => {
    const siguiente = lista[i + 1];
    const precioCierre = siguiente ? siguiente.precio : null;
    const variacion =
      precioCierre !== null && precioCierre !== undefined
        ? ((precioCierre - s.precio) / s.precio) * 100
        : null;

    let comportamiento = null;
    if (variacion !== null && variacion !== 0) {
      comportamiento = variacion > 0 ? 'subida' : 'bajada';
    }

    return {
      ...s,
      precioCierre,
      variacion,
      comportamiento,
      cierreEsActual: !siguiente
    };
  });

  const mostrar = filas.slice(-100).reverse();

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Histórico de lecturas del indicador</h2>

      {mostrar.length === 0 ? (
        <p style={{ color: 'var(--v3-text-soft)' }}>
          Sin lecturas registradas en el último año.
        </p>
      ) : (
        <div
          style={{
            border: '1px solid var(--v3-border)',
            borderRadius: 'var(--v3-radius-sm)',
            maxHeight: '420px',
            overflowY: 'auto',
            overflowX: 'auto'
          }}
        >
          <table className="v3-table" style={{ margin: 0 }}>
            <thead
              style={{
                position: 'sticky',
                top: 0,
                background: 'var(--v3-bg-soft)',
                zIndex: 1
              }}
            >
              <tr>
                <th>Fecha</th>
                <th>Tipo de lectura</th>
                <th>Precio en la lectura</th>
                <th>Indicador en la lectura</th>
                <th>Precio al cierre</th>
                <th>Variación posterior</th>
                <th>Comportamiento posterior</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {mostrar.map((s, i) => (
                <tr key={i}>
                  <td>{s.fecha}</td>
                  <td>{s.tipo}</td>
                  <td>{s.precio.toFixed(2)}</td>
                  <td>{s.smiEnSenal !== undefined ? s.smiEnSenal.toFixed(2) : '—'}</td>
                  <td>
                    {s.precioCierre !== null && s.precioCierre !== undefined
                      ? s.precioCierre.toFixed(2)
                      : '—'}
                  </td>
                  <td
                    className={
                      s.variacion !== null
                        ? s.variacion >= 0
                          ? 'v3-pos'
                          : 'v3-neg'
                        : ''
                    }
                  >
                    {s.variacion !== null
                      ? `${s.variacion >= 0 ? '+' : ''}${s.variacion.toFixed(2)}%`
                      : '—'}
                  </td>
                  <td>
                    {s.comportamiento === 'subida' && 'Subida'}
                    {s.comportamiento === 'bajada' && 'Bajada'}
                    {s.comportamiento === null && (
                      <span style={{ color: 'var(--v3-text-mute)' }}>—</span>
                    )}
                  </td>
                  <td>
                    {s.cierreEsActual ? (
                      <span style={{ color: 'var(--v3-text-mute)' }}>
                        Pendiente de cierre
                      </span>
                    ) : (
                      <span style={{ color: 'var(--v3-text-soft)' }}>Cerrado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '12px' }}>
        <strong>Criterio de comportamiento posterior:</strong> se registra la variación del precio
        desde la lectura hasta el cierre del ciclo (la lectura contraria siguiente). Si el ciclo no
        ha cerrado todavía, se muestra como <strong>pendiente de cierre</strong>.
      </p>

      <p style={{ color: 'var(--v3-text-mute)', fontSize: '13px', marginTop: '16px' }}>
        Las lecturas son registros estadísticos que se publican con reglas fijas y visibles. No
        representan operaciones reales realizadas por esta web ni constituyen una sugerencia de
        compra o venta. El comportamiento pasado no garantiza resultados futuros.
      </p>
    </section>
  );
}
