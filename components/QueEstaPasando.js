export default function QueEstaPasando({ analisis }) {
  if (!analisis) return null;

  const velas = analisis.velasUltimas60 || [];
  const smis = analisis.smisUltimos60 || [];

  if (velas.length < 6 || smis.length < 6) return null;

  const precioActual = velas[velas.length - 1].close;
  const precio5Atras = velas[velas.length - 6].close;
  const variacion5 = ((precioActual - precio5Atras) / precio5Atras) * 100;

  const volumenUltimo = analisis.volumenUltimo;
  const volumenMedio = analisis.volumenMedio60;
  let volumenTexto = 'sin datos de volumen suficientes';
  if (volumenUltimo && volumenMedio) {
    const ratio = (volumenUltimo / volumenMedio) * 100;
    volumenTexto = `${ratio.toFixed(0)}% de la media de 60 sesiones`;
  }

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
  const cambioZonaTexto =
    zonaActual === zona5Atras
      ? `se mantiene en zona ${zonaActual}`
      : `pasa de zona ${zona5Atras} a zona ${zonaActual}`;

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Qué está pasando</h2>
      <p style={{ color: 'var(--v3-text-mute)', fontSize: '13px', marginTop: '-4px' }}>
        Hechos de las últimas 5 sesiones. Sin interpretación.
      </p>

      <ul className="v3-card" style={{ listStyle: 'none', padding: '16px 20px', lineHeight: 1.8 }}>
        <li>
          <strong>Variación de precio en 5 sesiones:</strong>{' '}
          <span className={variacion5 >= 0 ? 'v3-pos' : 'v3-neg'}>
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
            <strong>Estado del registro histórico:</strong> posición abierta según las reglas
            predefinidas del algoritmo
          </li>
        )}
      </ul>
    </section>
  );
}
