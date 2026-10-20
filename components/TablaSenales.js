function situacionDesdeTipo(tipo) {
  if (tipo === 'compra') return 'Parte baja del rango';
  if (tipo === 'venta') return 'Parte alta del rango';
  return 'Parte intermedia del rango';
}

export default function TablaSenales({ senales, precioActual }) {
  if (!senales) return null;

  const lista = [...senales].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const mostrar = lista.slice(-100).reverse();

  return (
    <section className="v3-seccion">
      {mostrar.length === 0 ? (
        <p style={{ color: 'var(--v3-text-soft)' }}>Sin cambios de rango en el último año.</p>
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
                <th>Situación</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
              {mostrar.map((s, i) => (
                <tr key={i}>
                  <td>{s.fecha}</td>
                  <td>{situacionDesdeTipo(s.tipo)}</td>
                  <td>{s.precio.toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ color: 'var(--v3-text-mute)', fontSize: '13px', marginTop: '16px' }}>
        Las filas muestran cambios de situación dentro del rango reciente del precio. Son
        anotaciones estadísticas de hechos pasados y no constituyen una sugerencia de compra o
        venta. La evolución pasada no garantiza resultados futuros y no permite deducir
        probabilidades ni resultados futuros.
      </p>
    </section>
  );
}
