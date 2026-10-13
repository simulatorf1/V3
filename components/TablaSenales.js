export default function TablaSenales({ senales, precioActual }) {
  if (!senales) return null;

  const lista = [...senales].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));

  const filas = lista.map((s, i) => {
    const siguiente = lista[i + 1];
    const precioCierre = siguiente ? siguiente.precio : precioActual;
    const variacion = precioCierre
      ? ((precioCierre - s.precio) / s.precio) * 100
      : null;

    // Evaluación del acierto según el tipo de señal
    let acierto = null; // true, false, o null
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

  const mostrar = filas.slice(-20).reverse();

  return (
    <div style={{ marginTop: '30px' }}>
      <h2>Registro histórico de señales</h2>

      {mostrar.length === 0 ? (
        <p style={{ color: '#666' }}>Sin señales registradas en el último año.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Fecha</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Tipo</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Precio señal</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>SMI en la señal</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Precio cierre</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Variación del ciclo</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {mostrar.map((s, i) => {
              const colorVariacion = s.variacion === null
                ? '#666'
                : s.variacion >= 0 ? '#2e7d32' : '#c62828';

              let celdaResultado;
              if (s.acierto === true) {
                celdaResultado = <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>✓ Acierto</span>;
              } else if (s.acierto === false) {
                celdaResultado = <span style={{ color: '#c62828', fontWeight: 'bold' }}>✗ Fallo</span>;
              } else {
                celdaResultado = <span style={{ color: '#999' }}>—</span>;
              }

              return (
                <tr key={i}>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{s.fecha}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{s.tipo}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{s.precio.toFixed(2)}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {s.smiEnSenal !== undefined ? s.smiEnSenal.toFixed(2) : '—'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {s.precioCierre ? s.precioCierre.toFixed(2) : '—'}
                    {s.cierreEsActual && (
                      <span style={{ color: '#999', fontSize: '11px' }}> (abierta)</span>
                    )}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', color: colorVariacion }}>
                    {s.variacion !== null
                      ? `${s.variacion >= 0 ? '+' : ''}${s.variacion.toFixed(2)}%`
                      : '—'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{celdaResultado}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <p style={{ color: '#666', fontSize: '13px', marginTop: '12px' }}>
        <strong>Criterio de acierto:</strong> una señal de compra se considera acertada si el precio sube hasta la
        siguiente señal o hasta el día actual. Una señal de venta se considera acertada si el precio baja en el
        mismo intervalo.
      </p>

      <p style={{ color: '#666', fontSize: '13px', marginTop: '20px' }}>
        Las señales son registros automáticos que genera el algoritmo según sus reglas predefinidas.
        No representan operaciones reales realizadas por esta web ni constituyen una sugerencia de compra o venta.
        El rendimiento pasado no garantiza resultados futuros.
      </p>
    </div>
  );
}
