export default function TablaSenales({ senales, precioActual, velas }) {
  if (!senales) return null;

  const lista = [...senales].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const velasOrdenadas = Array.isArray(velas)
    ? [...velas].sort((a, b) => (a.date < b.date ? -1 : 1))
    : [];

  // Calcular para cada señal el extremo (máximo para compras, mínimo para ventas)
  // entre esa señal y la siguiente
  const filas = lista.map((s, i) => {
    const siguiente = lista[i + 1];
    const fechaInicio = s.fecha;
    const fechaFin = siguiente ? siguiente.fecha : null;

    let extremo = null;
    for (const v of velasOrdenadas) {
      if (v.date < fechaInicio) continue;
      if (fechaFin && v.date >= fechaFin) break;
      if (s.tipo === 'compra') {
        if (extremo === null || v.high > extremo) extremo = v.high;
      } else {
        if (extremo === null || v.low < extremo) extremo = v.low;
      }
    }

    let variacion = null;
    let acierto = null;

    if (extremo !== null) {
      if (s.tipo === 'compra') {
        variacion = ((extremo - s.precio) / s.precio) * 100;
        acierto = variacion > 0;
      } else {
        variacion = ((s.precio - extremo) / s.precio) * 100;
        acierto = variacion > 0;
      }
    }

    return {
      ...s,
      extremo,
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
                <th>Máx/Mín alcanzado</th>
                <th>Variación del ciclo</th>
                <th>Resultado</th>
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
                    {s.extremo !== null ? s.extremo.toFixed(2) : '—'}
                    {s.cierreEsActual && (
                      <span
                        style={{
                          color: 'var(--v3-text-mute)',
                          fontSize: '11px',
                          marginLeft: '4px'
                        }}
                      >
                        (abierta)
                      </span>
                    )}
                  </td>
                  <td className={s.variacion >= 0 ? 'v3-pos' : 'v3-neg'}>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '12px' }}>
        <strong>Criterio de acierto:</strong> un movimiento de compra se considera acertado si el
        precio alcanza un máximo superior al precio de la señal en algún momento antes de la
        siguiente señal. Un movimiento de venta se considera acertado si el precio alcanza un
        mínimo inferior al precio de la señal en el mismo intervalo.
      </p>

      <p style={{ color: 'var(--v3-text-mute)', fontSize: '13px', marginTop: '16px' }}>
        Los movimientos son registros estadísticos que se publican con reglas fijas y visibles. No
        representan operaciones reales realizadas por esta web ni constituyen una sugerencia de
        compra o venta. El rendimiento pasado no garantiza resultados futuros.
      </p>
    </section>
  );
}
