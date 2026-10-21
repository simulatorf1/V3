'use client';

export default function BloqueFundamentales({ datos }) {
  if (!datos) return null;

  const {
    sector,
    industria,
    marketCap,
    dividendYield,
    per,
    priceToBook,
    max52,
    min52,
    deudaNetaEbitda,
    roe,
    margenNeto,
    fcf,
    proximosResultados
  } = datos;

  function fmtNum(v, decimales = 2) {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    return Number(v).toFixed(decimales);
  }

  // Yahoo v7 devuelve dividendYield en porcentaje ya multiplicado (ej: 2.5 = 2.5%)
  function fmtPctDirecto(v, decimales = 2) {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    return `${Number(v).toFixed(decimales)}%`;
  }

  function fmtPctDecimal(v, decimales = 1) {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    return `${(Number(v) * 100).toFixed(decimales)}%`;
  }

  function fmtMillones(v) {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    if (Math.abs(v) >= 1e12) return `${(v / 1e12).toFixed(2)} B`;
    if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(2)} B`;
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)} M`;
    return Number(v).toLocaleString('es-ES');
  }

  function fmtFecha(fecha) {
    if (!fecha) return null;
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return null;
    }
  }

  const fechaResultados = fmtFecha(proximosResultados);

  const hayDatos =
    deudaNetaEbitda !== null ||
    roe !== null ||
    margenNeto !== null ||
    fcf !== null ||
    dividendYield !== null ||
    per !== null ||
    priceToBook !== null ||
    marketCap !== null ||
    fechaResultados;

  if (!hayDatos) return null;

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Datos fundamentales</h2>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '14px', marginTop: '-4px' }}>
        Información descriptiva sobre la situación financiera de la empresa y sus próximos
        eventos corporativos.
      </p>

      <div className="v3-card" style={{ padding: '20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '20px'
          }}
        >
          {marketCap !== null && (
            <Dato etiqueta="Capitalización" valor={fmtMillones(marketCap)} />
          )}
          {per !== null && (
            <Dato
              etiqueta="PER"
              valor={`${fmtNum(per)}x`}
              extra="Precio / beneficio por acción"
            />
          )}
          {priceToBook !== null && (
            <Dato
              etiqueta="Precio / Valor contable"
              valor={`${fmtNum(priceToBook)}x`}
              extra="Relación entre precio y valor en libros"
            />
          )}
          {dividendYield !== null && (
            <Dato
              etiqueta="Rentabilidad por dividendo"
              valor={fmtPctDirecto(dividendYield)}
              extra="Dividendo anual sobre precio actual"
            />
          )}
          {max52 !== null && min52 !== null && (
            <Dato
              etiqueta="Rango 52 semanas"
              valor={`${fmtNum(min52)} – ${fmtNum(max52)} €`}
              extra="Mínimo y máximo del último año"
            />
          )}
          {deudaNetaEbitda !== null && (
            <Dato
              etiqueta="Deuda Neta / EBITDA"
              valor={`${fmtNum(deudaNetaEbitda)}x`}
              extra="Años de beneficio operativo para pagar la deuda"
            />
          )}
          {roe !== null && (
            <Dato
              etiqueta="ROE"
              valor={fmtPctDecimal(roe)}
              extra="Rentabilidad sobre fondos propios"
            />
          )}
          {margenNeto !== null && (
            <Dato
              etiqueta="Margen neto"
              valor={fmtPctDecimal(margenNeto)}
              extra="Beneficio neto sobre ventas"
            />
          )}
          {fcf !== null && (
            <Dato
              etiqueta="Flujo de caja libre"
              valor={fmtMillones(fcf)}
              extra="Efectivo disponible tras inversiones"
            />
          )}
        </div>

        {fechaResultados && (
          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--v3-border)',
              fontSize: '14px'
            }}
          >
            <strong>Próxima presentación de resultados:</strong> {fechaResultados}
          </div>
        )}

        {(sector || industria) && (
          <p
            style={{
              margin: '12px 0 0 0',
              fontSize: '13px',
              color: 'var(--v3-text-mute)'
            }}
          >
            {sector && `Sector: ${sector}`}
            {industria && ` · Industria: ${industria}`}
          </p>
        )}
      </div>

      <p style={{ color: 'var(--v3-text-mute)', fontSize: '13px', marginTop: '12px' }}>
        Estos datos proceden de fuentes públicas de mercado y se presentan con carácter
        exclusivamente descriptivo. No constituyen una valoración, una recomendación de inversión
        ni una previsión de resultados futuros.
      </p>
    </section>
  );
}

function Dato({ etiqueta, valor, extra }) {
  return (
    <div>
      <div
        style={{
          color: 'var(--v3-text-mute)',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: 600,
          marginBottom: '6px'
        }}
      >
        {etiqueta}
      </div>
      <div
        style={{
          fontSize: '22px',
          fontWeight: 700,
          color: 'var(--v3-text)',
          lineHeight: 1.2,
          wordBreak: 'break-word'
        }}
      >
        {valor}
      </div>
      {extra && (
        <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--v3-text-soft)' }}>
          {extra}
        </div>
      )}
    </div>
  );
}
