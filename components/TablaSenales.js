export default function TablaSenales({ senales, precioActual }) {
  if (!senales) return null;

  // Mostramos las últimas 20 señales, de más reciente a más antigua
  const lista = [...senales].slice(-20).reverse();

  return (
    <div style={{ marginTop: '30px' }}>
      <h2>Registro histórico de señales</h2>

      {lista.length === 0 ? (
        <p style={{ color: '#666' }}>Sin señales registradas en el último año.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Fecha</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Tipo</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Precio referencia</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>SMI en la señal</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Precio actual</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Variación desde la señal</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((s, i) => {
              const variacion = precioActual
                ? ((precioActual - s.precio) / s.precio) * 100
                : null;
              const color = variacion === null
                ? '#666'
                : variacion >= 0 ? '#2e7d32' : '#c62828';
              return (
                <tr key={i}>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{s.fecha}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{s.tipo}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{s.precio.toFixed(2)}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {s.smiEnSenal !== undefined ? s.smiEnSenal.toFixed(2) : '—'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {precioActual ? precioActual.toFixed(2) : '—'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', color }}>
                    {variacion !== null
                      ? `${variacion >= 0 ? '+' : ''}${variacion.toFixed(2)}%`
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <p style={{ color: '#666', fontSize: '13px', marginTop: '20px' }}>
        Las señales son registros automáticos que genera el algoritmo según sus reglas predefinidas.
        No representan operaciones reales realizadas por esta web ni constituyen una sugerencia de compra o venta.
        El rendimiento pasado no garantiza resultados futuros.
      </p>
    </div>
  );
}
