'use client';

import { useEffect, useState } from 'react';

export default function ResumenVistazo({ analisis, empresa }) {
  const [consenso, setConsenso] = useState(null);

  useEffect(() => {
    if (!empresa?.ticker) return;
    fetch(`/api/votos?ticker=${encodeURIComponent(empresa.ticker)}`)
      .then((r) => r.json())
      .then((d) => setConsenso(d))
      .catch(() => {});
  }, [empresa?.ticker]);

  if (!analisis) return null;

  const velas = analisis.velasUltimas60 || [];
  if (velas.length < 6) return null;

  const precioActual = velas[velas.length - 1].close;
  const precio5Atras = velas[velas.length - 6].close;
  const variacion5 = ((precioActual - precio5Atras) / precio5Atras) * 100;

  const smiActual = analisis.smiActual;
  const zona = analisis.zona;

  const smisValidos = (analisis.smisUltimos60 || []).filter(
    (v) => v !== null && v !== undefined
  );
  const smisOrdenados = [...smisValidos].sort((a, b) => a - b);
  let percentil = 0;
  if (smisOrdenados.length > 0) {
    const menores = smisOrdenados.filter((v) => v < smiActual).length;
    percentil = Math.round((menores / smisOrdenados.length) * 100);
  }

  let riesgo = 'bajo';
  let colorRiesgo = 'var(--v3-positive)';
  if (zona === 'alta' || zona === 'baja') {
    riesgo = 'medio';
    colorRiesgo = 'var(--v3-warn)';
  }
  if (Math.abs(smiActual) > 70) {
    riesgo = 'alto';
    colorRiesgo = 'var(--v3-negative)';
  }

  const colorZona =
    zona === 'alta'
      ? 'var(--v3-negative)'
      : zona === 'baja'
      ? 'var(--v3-positive)'
      : 'var(--v3-text-soft)';

  // Texto de consenso
  let textoConsenso = 'sin votos';
  if (consenso && consenso.total > 0) {
    const conteo = consenso.conteo;
    const max = Math.max(conteo.seguimiento, conteo.cartera, conteo.fuera);
    if (conteo.seguimiento === max) textoConsenso = 'en seguimiento';
    else if (conteo.cartera === max) textoConsenso = 'en cartera';
    else textoConsenso = 'fuera';
  }

  const celda = { padding: '4px 0' };
  const etiqueta = {
    color: 'var(--v3-text-mute)',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: 600
  };
  const valor = {
    fontSize: '20px',
    fontWeight: 700,
    marginTop: '2px'
  };
  const sub = {
    color: 'var(--v3-text-soft)',
    fontSize: '13px',
    marginTop: '2px'
  };

  return (
    <section className="v3-card-soft" style={{ marginTop: '30px' }}>
      <h2 style={{ marginTop: 0, marginBottom: '16px' }}>Resumen de un vistazo</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '20px'
        }}
      >
        <div style={celda}>
          <div style={etiqueta}>Precio actual</div>
          <div style={valor}>{precioActual.toFixed(2)}</div>
          <div
            style={{
              ...sub,
              color: variacion5 >= 0 ? 'var(--v3-positive)' : 'var(--v3-negative)'
            }}
          >
            {variacion5 >= 0 ? '+' : ''}
            {variacion5.toFixed(2)}% en 5 sesiones
          </div>
        </div>

        <div style={celda}>
          <div style={etiqueta}>Zona del indicador</div>
          <div style={{ ...valor, color: colorZona }}>{zona}</div>
          <div style={sub}>percentil {percentil} del rango de 60 sesiones</div>
        </div>

        <div style={celda}>
          <div style={etiqueta}>Nivel de riesgo</div>
          <div style={{ ...valor, color: colorRiesgo }}>{riesgo}</div>
          <div style={sub}>calculado sobre el indicador</div>
        </div>

        <div style={celda}>
          <div style={etiqueta}>Consenso comunidad</div>
          <div style={{ ...valor, color: 'var(--v3-text)' }}>{textoConsenso}</div>
          <div style={sub}>
            {consenso && consenso.total > 0
              ? `${consenso.total} voto${consenso.total === 1 ? '' : 's'}`
              : 'disponible en la sección inferior'}
          </div>
        </div>
      </div>
    </section>
  );
}
