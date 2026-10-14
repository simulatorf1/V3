export default function ComparadorSector({ empresa, analisis }) {
  if (!analisis || !analisis.sectorInfo) return null;

  const info = analisis.sectorInfo;
  const { sector, etf, variacionEmpresa60, variacionSector60 } = info;

  if (variacionEmpresa60 === null || variacionSector60 === null) return null;

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Comparador con el sector</h2>

      <div className="v3-card" style={{ padding: '20px' }}>
        <p style={{ fontSize: '16px', margin: 0 }}>
          <strong>{empresa.nombre}</strong> vs media del sector <strong>{sector}</strong> en los
          últimos 60 días:{' '}
          <span className={variacionEmpresa60 >= 0 ? 'v3-pos' : 'v3-neg'}>
            {variacionEmpresa60 >= 0 ? '+' : ''}
            {variacionEmpresa60.toFixed(2)}%
          </span>{' '}
          vs{' '}
          <span className={variacionSector60 >= 0 ? 'v3-pos' : 'v3-neg'}>
            {variacionSector60 >= 0 ? '+' : ''}
            {variacionSector60.toFixed(2)}%
          </span>
        </p>
        <p style={{ color: 'var(--v3-text-mute)', fontSize: '13px', margin: '12px 0 0 0' }}>
          Referencia sectorial: ETF {etf}.
        </p>
      </div>

      <p style={{ color: 'var(--v3-text-mute)', fontSize: '13px', marginTop: '12px' }}>
        Los datos comparativos se basan en series históricas públicas y no implican juicio de valor
        sobre la empresa ni sobre el sector.
      </p>
    </section>
  );
}
