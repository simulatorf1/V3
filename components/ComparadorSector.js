export default function ComparadorSector({ empresa, analisis }) {
  if (!analisis || !analisis.sectorInfo) return null;

  const info = analisis.sectorInfo;
  const { sector, etf, variacionEmpresa60, variacionSector60 } = info;

  if (variacionEmpresa60 === null || variacionSector60 === null) return null;

  const colorEmpresa = variacionEmpresa60 >= 0 ? '#2e7d32' : '#c62828';
  const colorSector = variacionSector60 >= 0 ? '#2e7d32' : '#c62828';

  return (
    <div style={{ marginTop: '30px' }}>
      <h2>Comparador con el sector</h2>

      <p style={{ fontSize: '15px' }}>
        <strong>{empresa.nombre}</strong> vs media del sector <strong>{sector}</strong> en los últimos 60 días:{' '}
        <span style={{ color: colorEmpresa }}>
          {variacionEmpresa60 >= 0 ? '+' : ''}
          {variacionEmpresa60.toFixed(2)}%
        </span>{' '}
        vs{' '}
        <span style={{ color: colorSector }}>
          {variacionSector60 >= 0 ? '+' : ''}
          {variacionSector60.toFixed(2)}%
        </span>
      </p>

      <p style={{ color: '#666', fontSize: '13px' }}>
        Referencia sectorial: ETF {etf}.
      </p>

      <p style={{ color: '#666', fontSize: '13px', marginTop: '20px' }}>
        Los datos comparativos se basan en series históricas públicas y no implican juicio de valor
        sobre la empresa ni sobre el sector.
      </p>
    </div>
  );
}
