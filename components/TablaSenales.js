export default function TablaSenales({ senales, precioActual }) {
  if (!senales) return null;

  const lista = [...senales].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));

  const filas = lista.map((s, i) => {
    const siguiente = lista[i + 1];
    const precioCierre = siguiente ? siguiente.precio : precioActual;
    const variacion = precioCierre
      ? ((precioCierre - s.precio) / s.precio) * 100
      : null;

    let acierto = null;
    if (variacion !== null && variacion !== 0) {
      if (s.tipo === 'compra') acierto = variacion > 0;
      else if (s.tipo === 'venta') acierto = variacion < 0;
    }

    return { ...s, precioCierre, variacion, acierto, cierreEsActual: !siguiente };
  });

  // Mostramos hasta 100, de más reciente a más antigua
  const mostrar = filas.slice(-100).reverse();

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Registro histórico de señales</h2>

      {mostrar.length === 0 ? (
        <p style={{ color: 'var(--v3-text-soft)' }}>
          Sin señales registradas en el último año.
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
                <th>SMI en la señal</th>
                <th>Precio cierre</th>
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
                    {s.precioCierre ? s.precioCierre.toFixed(2) : '—'}
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
        <strong>Criterio de acierto:</strong> una señal de compra se considera acertada si el
        precio sube hasta la siguiente señal o hasta el día actual. Una señal de venta se considera
        acertada si el precio baja en el mismo intervalo.
      </p>

      <p style={{ color: 'var(--v3-text-mute)', fontSize: '13px', marginTop: '16px' }}>
        Las señales son registros automáticos que genera el algoritmo según sus reglas predefinidas.
        No representan operaciones reales realizadas por esta web ni constituyen una sugerencia de
        compra o venta. El rendimiento pasado no garantiza resultados futuros.
      </p>
    </section>
  );
}
