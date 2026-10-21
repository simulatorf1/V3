'use client';

export default function BloqueFundamentales({ datos }) {
  if (!datos) return null;

  const {
    roe,
    margenNeto,
    margenEbitda,
    deudaEbitda,
    deudaEquity
  } = datos;

  function fmtPct(v, decimales = 1) {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    return `${Number(v).toFixed(decimales)}%`;
  }

  function fmtNum(v, decimales = 2) {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    return Number(v).toFixed(decimales);
  }

  const hayDatos =
    roe !== null ||
    margenNeto !== null ||
    margenEbitda !== null ||
    deudaEbitda !== null ||
    deudaEquity !== null;

  if (!hayDatos) return null;

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Datos fundamentales</h2>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '14px', marginTop: '-4px' }}>
        Información descriptiva sobre la situación financiera de la empresa.
      </p>

      <div className="v3-card" style={{ padding: '20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '20px'
          }}
        >
          {roe !== null && (
            <Dato
              etiqueta="ROE"
              valor={fmtPct(roe)}
              extra="Rentabilidad sobre fondos propios"
            />
          )}
          {margenNeto !== null && (
            <Dato
              etiqueta="Margen neto"
              valor={fmtPct(margenNeto)}
              extra="Beneficio neto sobre ventas"
            />
          )}
          {margenEbitda !== null && (
            <Dato
              etiqueta="Margen EBITDA"
              valor={fmtPct(margenEbitda)}
              extra="Beneficio operativo antes de amortizaciones"
            />
          )}
          {deudaEbitda !== null && (
            <Dato
              etiqueta="Deuda / EBITDA"
              valor={`${fmtNum(deudaEbitda)}x`}
              extra="Años de beneficio operativo para pagar la deuda"
            />
          )}
          {deudaEquity !== null && (
            <Dato
              etiqueta="Deuda / Patrimonio"
              valor={`${fmtNum(deudaEquity)}x`}
              extra="Apalancamiento financiero"
            />
          )}
        </div>
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
