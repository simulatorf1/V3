export default function QueEstaPasando({ analisis }) {
  if (!analisis) return null;

  const velas = analisis.velasUltimas60 || [];
  const smis = analisis.smisUltimos60 || [];

  if (velas.length < 6 || smis.length < 6) return null;

  // Variación de las últimas 5 sesiones
  const precioActual = velas[velas.length - 1].close;
  const precio5Atras = velas[velas.length - 6].close;
  const variacion5 = ((precioActual - precio5Atras) / precio5Atras) * 100;

  // Volumen del último día vs media 60 sesiones
  const volumenUltimo = analisis.volumenUltimo;
  const volumenMedio = analisis.volumenMedio60;
  let volumenTexto = 'sin datos de volumen suficientes';
  if (volumenUltimo && volumenMedio) {
    const ratio = (volumenUltimo / volumenMedio) * 100;
    volumenTexto = `${ratio.toFixed(0)}% de la media de 60 sesiones`;
  }

  // Cambio de zona del SMI en las últimas 5 sesiones
  const smiActual = smis[smis.length - 1];
  const smi5Atras = smis[smis.length - 6];

  function clasificarZona(v) {
    if (v === null || v === undefined) return 'desconocida';
    if (v > 40) return 'alta';
    if (v < -40) return 'baja';
    return 'intermedia';
  }

  const zonaActual = clasificarZona(smiActual);
  const zona5Atras = clasificarZona(smi5Atras);
  let cambioZonaTexto;
  if (zonaActual === zona5Atras) {
    cambioZonaTexto = `se mantiene en zona ${zonaActual}`;
  } else {
    cambioZonaTexto = `pasa de zona ${zona5Atras} a zona ${zonaActual}`;
  }

  return (
    <div style={{ marginTop: '30px' }}>
      <h2>Qué está pasando</h2>
      <p style={{ color: '#666', fontSize: '13px', marginTop: '-8px' }}>
        Hechos de las últimas 5 sesiones. Sin interpretación.
      </p>

      <ul style={{ lineHeight: '1.8' }}>
        <li>
          <strong>Variación de precio en 5 sesiones:</strong>{' '}
          <span style={{ color: variacion5 >= 0 ? '#2e7d32' : '#c62828' }}>
            {variacion5 >= 0 ? '+' : ''}
            {variacion5.toFixed(2)}%
          </span>
        </li>
        <li>
          <strong>Volumen del último día:</strong> {volumenTexto}
        </li>
        <li>
          <strong>Indicador propietario:</strong> {cambioZonaTexto}
        </li>
        {analisis.posicionAbierta && (
          <li>
            <strong>Estado del registro histórico:</strong> posición abierta según las reglas predefinidas del algoritmo
          </li>
        )}
      </ul>
    </div>
  );
}
