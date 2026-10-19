export default function TablaSenales({ senales, precioActual }) {
  if (!senales) return null;

  const lista = [...senales].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));

  const filas = lista.map((s, i) => {
    const siguiente = lista[i + 1];
    const precioCierre = siguiente ? siguiente.precio : null; // ciclo abierto -> null
    const variacion =
      precioCierre !== null && precioCierre !== undefined
        ? ((precioCierre - s.precio) / s.precio) * 100
        : null;

    let acierto = null;
    if (variacion !== null && variacion !== 0) {
      if (s.tipo === 'compra') acierto = variacion > 0;
      else if (s.tipo === 'venta') acierto = variacion < 0;
    }

    return {
      ...s,
      precioCierre,
      variacion,
      acierto,
      cierreEsActual: !siguiente
    };
  });

  const mostrar = filas.slice(-100).reverse();

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Histórico de movimientos estadísticos</h2>

      {mostrar.length === 0 ? (
        <p style={{ color: 'var(--v3-text-soft)' }}>
          Sin movimientos registrados en el último año.
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
                <th>Tipo</th>
                <th>Precio señal</th>
                <th>Indicador en la señal</th>
                <th>Precio cierre</th>
                <th>Variación del ciclo</th>
                <th>Resultado</th>
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
                  <td>{s.precioCierre !== null && s.precioCierre !== undefined ? s.precioCierre.toFixed(2) : '—'}</td>
                  <td className={s.variacion !== null && s.variacion >= 0 ? 'v3-pos' : s.variacion !== null ? 'v3-neg' : ''}>
                    {s.variacion !== null
                      ? `${s.variacion >= 0 ? '+' : ''}${s.variacion.toFixed(2)}%`
                      : '—'}
                  </td>
                  <td>
                    {s.acierto === true && <span className="v3-pos">✓ Acierto</span>}
                    {s.acierto === false && <span className="v3-neg">✗ Fallo</span>}
                    {s.acierto === null && (
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
        <strong>Criterio de acierto:</strong> un movimiento de compra se considera acertado si el
        precio sube hasta el cierre del ciclo (el movimiento contrario siguiente). Un movimiento de
        venta se considera acertado si el precio baja en el mismo intervalo. Si el ciclo no ha
        cerrado todavía, se muestra como <strong>pendiente de cierre</strong> y no se computa como
        acierto ni fallo.
      </p>

      <p style={{ color: 'var(--v3-text-mute)', fontSize: '13px', marginTop: '16px' }}>
        Los movimientos son registros estadísticos que se publican con reglas fijas y visibles. No
        representan operaciones reales realizadas por esta web ni constituyen una sugerencia de
        compra o venta. El rendimiento pasado no garantiza resultados futuros.
      </p>
    </section>
  );
}
