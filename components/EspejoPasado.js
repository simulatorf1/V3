// components/EspejoPasado.js
const estiloAcordeon = {
  marginTop: '16px',
  marginBottom: '16px',
  border: '1px solid var(--v3-border)',
  borderRadius: 'var(--v3-radius-sm, 8px)',
  background: 'var(--v3-bg-soft)'
};

const estiloSummary = {
  cursor: 'pointer',
  padding: '14px 20px',
  fontWeight: 700,
  fontSize: '15px',
  listStyle: 'none'
};

function formatearFecha(fechaStr) {
  if (!fechaStr) return '';
  try {
    const d = new Date(fechaStr + 'T00:00:00');
    const meses = [
      'ene', 'feb', 'mar', 'abr', 'may', 'jun',
      'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
    ];
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return '';
  }
}

function formatearVariacion(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

export default function EspejoPasado({ proyeccionDiaria, proyeccionSemanal }) {
  const diario = proyeccionDiaria?.casos || [];
  const semanal = proyeccionSemanal?.casos || [];

  if (diario.length === 0 && semanal.length === 0) return null;

  return (
    <details style={estiloAcordeon}>
      <summary style={estiloSummary}>
        El espejo del pasado · {diario.length + semanal.length} casos históricos similares
      </summary>
      <div style={{ padding: '0 20px 20px 20px' }}>
        <p
          style={{
            marginTop: 0,
            fontSize: '12.5px',
            color: 'var(--v3-text-soft)',
            lineHeight: 1.6
          }}
        >
          Estas son las fechas exactas en las que el indicador Equaty estuvo en una posición
          similar a la actual. Se muestra qué ocurrió en las 10 sesiones o 10 semanas posteriores.
        </p>

        {diario.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                color: 'var(--v3-text-mute)',
                marginBottom: '8px'
              }}
            >
              Corto plazo (10 sesiones)
            </div>
            <div style={{ display: 'grid', gap: '6px' }}>
              {diario.map((c, i) => (
                <div
                  key={`d-${i}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#fff',
                    border: '1px solid var(--v3-border)',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}
                >
                  <span>
                    {formatearFecha(c.fecha)} → {formatearFecha(c.fechaFin)}
                  </span>
                  <strong
                    style={{
                      color: c.variacion >= 0 ? '#166534' : '#991b1b'
                    }}
                  >
                    {formatearVariacion(c.variacion)}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {semanal.length > 0 && (
          <div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                color: 'var(--v3-text-mute)',
                marginBottom: '8px'
              }}
            >
              Largo plazo (10 semanas)
            </div>
            <div style={{ display: 'grid', gap: '6px' }}>
              {semanal.map((c, i) => (
                <div
                  key={`s-${i}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#fff',
                    border: '1px solid var(--v3-border)',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}
                >
                  <span>
                    {formatearFecha(c.fecha)} → {formatearFecha(c.fechaFin)}
                  </span>
                  <strong
                    style={{
                      color: c.variacion >= 0 ? '#166534' : '#991b1b'
                    }}
                  >
                    {formatearVariacion(c.variacion)}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}

        <p
          style={{
            margin: '14px 0 0 0',
            fontSize: '11px',
            color: 'var(--v3-text-mute)',
            lineHeight: 1.5
          }}
        >
          Estos datos describen lo que ocurrió en el pasado. No predicen el futuro ni constituyen
          una recomendación de inversión.
        </p>
      </div>
    </details>
  );
}
