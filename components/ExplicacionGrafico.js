export default function ExplicacionGrafico({ analisis }) {
  if (!analisis) return null;

  const zona = analisis.zona;
  const smi = analisis.smiActual;
  const smis = (analisis.smisUltimos60 || []).filter(
    (v) => v !== null && v !== undefined
  );
  const ordenados = [...smis].sort((a, b) => a - b);
  const menores = ordenados.filter((v) => v < smi).length;
  const percentil =
    ordenados.length > 0 ? Math.round((menores / ordenados.length) * 100) : 0;

  // Estadística por ciclos
  const senales = analisis.senales || [];
  const lista = [...senales].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const ciclos = lista.map((s, i) => {
    const siguiente = lista[i + 1];
    const precioCierre = siguiente ? siguiente.precio : analisis.precioActual;
    const variacion = precioCierre
      ? ((precioCierre - s.precio) / s.precio) * 100
      : 0;
    let acierto = null;
    if (variacion !== 0) {
      if (s.tipo === 'compra') acierto = variacion > 0;
      else if (s.tipo === 'venta') acierto = variacion < 0;
    }
    return { tipo: s.tipo, acierto };
  });

  const compras = ciclos.filter((c) => c.tipo === 'compra');
  const ventas = ciclos.filter((c) => c.tipo === 'venta');

  function statsCiclo(listaCiclos) {
    let aciertos = 0;
    let total = 0;
    for (const c of listaCiclos) {
      if (c.acierto === null) continue;
      total++;
      if (c.acierto) aciertos++;
    }
    return {
      total: listaCiclos.length,
      aciertos,
      porcentaje: total > 0 ? (aciertos / total) * 100 : 0
    };
  }

  const statsCompras = statsCiclo(compras);
  const statsVentas = statsCiclo(ventas);

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Cómo interpretar el gráfico</h2>

      <div className="v3-card" style={{ lineHeight: 1.7 }}>
        <h3 style={{ marginTop: 0 }}>Qué muestra cada elemento</h3>
        <ul>
          <li>
            <strong>Línea azul (eje derecho):</strong> precio de cierre de las últimas 60
            sesiones.
          </li>
          <li>
            <strong>Línea morada (eje izquierdo):</strong> indicador propio del equipo, con
            escala de -100 a +100.
          </li>
          <li>
            <strong>Banda roja en +40:</strong> umbral de zona alta.
          </li>
          <li>
            <strong>Banda verde en -40:</strong> umbral de zona baja.
          </li>
          <li>
            <strong>Área roja sombreada:</strong> tramos en los que el indicador ha sobresalido
            por encima de la zona alta.
          </li>
          <li>
            <strong>Área verde sombreada:</strong> tramos en los que el indicador ha caído por
            debajo de la zona baja.
          </li>
        </ul>
      </div>

      <div className="v3-card" style={{ marginTop: '16px', lineHeight: 1.7 }}>
        <h3 style={{ marginTop: 0 }}>Situación actual</h3>
        <p>
          El indicador se encuentra actualmente en <strong>zona {zona}</strong>, con un valor de{' '}
          <strong>{smi?.toFixed(2)}</strong> y un <strong>percentil {percentil}</strong> dentro
          del rango de las últimas 60 sesiones.
        </p>
        {zona === 'alta' && (
          <p style={{ color: 'var(--v3-text-soft)' }}>
            La zona alta indica que el precio se sitúa en la parte superior de su rango reciente.
            Históricamente, este tipo de situación ha tendido a resolverse con correcciones o
            consolidaciones antes que con continuaciones sostenidas.
          </p>
        )}
        {zona === 'baja' && (
          <p style={{ color: 'var(--v3-text-soft)' }}>
            La zona baja indica que el precio se sitúa en la parte inferior de su rango reciente.
            Históricamente, este tipo de situación ha tendido a resolverse con rebotes o
            estabilizaciones antes que con caídas sostenidas.
          </p>
        )}
        {zona === 'intermedia' && (
          <p style={{ color: 'var(--v3-text-soft)' }}>
            La zona intermedia indica que el precio se encuentra en un rango sin sesgo
            estadístico claro. No hay información histórica que permita anticipar el siguiente
            movimiento con una orientación definida.
          </p>
        )}
      </div>

      <div className="v3-card" style={{ marginTop: '16px', lineHeight: 1.7 }}>
        <h3 style={{ marginTop: 0 }}>Cómo se reflejaron estadísticamente los movimientos</h3>
        <p>
          Cada vez que el indicador gira desde la zona baja hacia arriba, se registra un{' '}
          <strong>movimiento de compra</strong>. Cada vez que gira desde la zona alta hacia
          abajo, se registra un <strong>movimiento de venta</strong>. Estos registros se cierran
          con el movimiento contrario siguiente, o con el precio actual si el último sigue
          abierto.
        </p>
        <p>
          En el último año, se han registrado{' '}
          <strong>{statsCompras.total} movimientos de compra</strong> y{' '}
          <strong>{statsVentas.total} movimientos de venta</strong>.
        </p>
        {statsCompras.total > 0 && (
          <p>
            De los movimientos de compra, el <strong>{statsCompras.porcentaje.toFixed(1)}%</strong>{' '}
            cerraron con subida de precio hasta el siguiente movimiento contrario.
          </p>
        )}
        {statsVentas.total > 0 && (
          <p>
            De los movimientos de venta, el <strong>{statsVentas.porcentaje.toFixed(1)}%</strong>{' '}
            cerraron con bajada de precio hasta el siguiente movimiento contrario.
          </p>
        )}
        {(statsCompras.total < 10 || statsVentas.total < 10) && (
          <p style={{ color: 'var(--v3-negative)', fontSize: '13px' }}>
            Muestra limitada en alguno de los tipos de movimiento. Interpretar con cautela.
          </p>
        )}
      </div>

      <p className="v3-aviso-mute" style={{ marginTop: '16px' }}>
        Este gráfico y las estadísticas mostradas describen comportamiento histórico. No
        constituyen una predicción del futuro ni una recomendación de inversión. El usuario debe
        tomar sus propias decisiones.
      </p>
    </section>
  );
}
