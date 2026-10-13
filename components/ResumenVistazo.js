export default function ResumenVistazo({ analisis, empresa }) {
  if (!analisis) return null;

  const velas = analisis.velasUltimas60 || [];
  if (velas.length < 6) return null;

  const precioActual = velas[velas.length - 1].close;
  const precio5Atras = velas[velas.length - 6].close;
  const variacion5 = ((precioActual - precio5Atras) / precio5Atras) * 100;

  const smiActual = analisis.smiActual;
  const zona = analisis.zona;

  // Percentil del SMI dentro de las últimas 60 sesiones
  const smisValidos = (analisis.smisUltimos60 || []).filter((v) => v !== null && v !== undefined);
  const smisOrdenados = [...smisValidos].sort((a, b) => a - b);
  let percentil = 0;
  if (smisOrdenados.length > 0) {
    const menores = smisOrdenados.filter((v) => v < smiActual).length;
    percentil = Math.round((menores / smisOrdenados.length) * 100);
  }

  // Riesgo: basado en zona del SMI y en señales recientes
  let riesgo = 'bajo';
  let colorRiesgo = '#2e7d32';
  if (zona === 'alta' || zona === 'baja') {
    riesgo = 'medio';
    colorRiesgo = '#ef6c00';
  }
  if (Math.abs(smiActual) > 70) {
    riesgo = 'alto';
    colorRiesgo = '#c62828';
  }

  const colorZona = {
    alta: '#c62828',
    baja: '#2e7d32',
    intermedia: '#616161'
  }[zona] || '#616161';

  return (
    <div
      style={{
        background: '#f8f9fa',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '20px',
        marginTop: '30px'
      }}
    >
      <h2 style={{ marginTop: 0 }}>Resumen de un vistazo</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div>
          <div style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase' }}>Precio actual</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{precioActual.toFixed(2)}</div>
          <div style={{ color: variacion5 >= 0 ? '#2e7d32' : '#c62828', fontSize: '13px' }}>
            {variacion5 >= 0 ? '+' : ''}{variacion5.toFixed(2)}% en 5 sesiones
          </div>
        </div>

        <div>
          <div style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase' }}>Zona del indicador</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: colorZona }}>
            {zona}
          </div>
          <div style={{ color: '#666', fontSize: '13px' }}>
            percentil {percentil} del rango de 60 sesiones
          </div>
        </div>

        <div>
          <div style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase' }}>Nivel de riesgo</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: colorRiesgo }}>
            {riesgo}
          </div>
          <div style={{ color: '#666', fontSize: '13px' }}>
            calculado sobre el indicador
          </div>
        </div>

        <div>
          <div style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase' }}>Consenso comunidad</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#616161' }}>
            —
          </div>
          <div style={{ color: '#666', fontSize: '13px' }}>
            disponible próximamente
          </div>
        </div>
      </div>
    </div>
  );
}
