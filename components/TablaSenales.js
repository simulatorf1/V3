function etiquetaLectura(tipo) {
  if (tipo === 'compra') return 'Categoría C';
  if (tipo === 'venta') return 'Categoría A';
  return '—';
}

export default function TablaSenales({ senales, precioActual }) {
  if (!senales) return null;

  const lista = [...senales].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const mostrar = lista.slice(-100).reverse();

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Histórico de registros del indicador</h2>

      {mostrar.length === 0 ? (
        <p style={{ color: 'var(--v3-text-soft)' }}>
          Sin registros en el último año.
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
                <th>Categoría en el registro</th>
                <th>Precio en el registro</th>
                <th>Indicador en el registro</th>
              </tr>
            </thead>
            <tbody>
              {mostrar.map((s, i) => (
                <tr key={i}>
                  <td>{s.fecha}</td>
                  <td>{etiquetaLectura(s.tipo)}</td>
                  <td>{s.precio.toFixed(2)}</td>
                  <td>{s.smiEnSenal !== undefined ? s.smiEnSenal.toFixed(2) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ color: 'var(--v3-text-mute)', fontSize: '13px', marginTop: '16px' }}>
        Los registros son anotaciones estadísticas que se publican con reglas fijas y visibles. No
        representan operaciones reales realizadas por esta web ni constituyen una sugerencia de
        compra o venta. La evolución pasada no garantiza resultados futuros y no permite deducir
        probabilidades ni resultados futuros.
      </p>
    </section>
  );
}
