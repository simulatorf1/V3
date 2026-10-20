export default function ComparadorSector({ empresa, analisis }) {
  if (!analisis || !analisis.sectorInfo) return null;

  const info = analisis.sectorInfo;
  const { sector, etf, variacionEmpresa60, variacionSector60 } = info;

  if (variacionEmpresa60 === null || variacionSector60 === null) return null;

  return (
    <section className="v3-seccion">
      <div className="v3-card" style={{ padding: '20px' }}>
        <p style={{ fontSize: '16px', margin: 0 }}>
          <strong>{empresa.nombre}</strong> frente a la media del sector <strong>{sector}</strong>{' '}
          en los últimos 60 días: <strong>{variacionEmpresa60 >= 0 ? '+' : ''}{variacionEmpresa60.toFixed(2)}%</strong>{' '}
          frente a <strong>{variacionSector60 >= 0 ? '+' : ''}{variacionSector60.toFixed(2)}%</strong>.
        </p>
        <p style={{ color: 'var(--v3-text-mute)', fontSize: '13px', margin: '12px 0 0 0' }}>
          Referencia sectorial: ETF {etf}.
        </p>
      </div>

      <p style={{ color: 'var(--v3-text-mute)', fontSize: '13px', marginTop: '12px' }}>
        Los datos comparativos se basan en series históricas públicas y se presentan con carácter
        exclusivamente descriptivo. No implican juicio de valor sobre la empresa ni sobre el
        sector, no anticipan movimientos futuros y no constituyen recomendación de inversión.
      </p>
    </section>
  );
}
