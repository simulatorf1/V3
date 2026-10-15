'use client';

import { useEffect, useState } from 'react';

function obtenerOCrearCookieId() {
  if (typeof document === 'undefined') return null;
  const nombre = 'v3_cookie_id';
  const match = document.cookie.match(new RegExp('(?:^|; )' + nombre + '=([^;]*)'));
  if (match) return decodeURIComponent(match[1]);

  const nuevo = 'v3_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  const unAnio = 60 * 60 * 24 * 365;
  document.cookie = `${nombre}=${encodeURIComponent(nuevo)}; max-age=${unAnio}; path=/; SameSite=Lax`;
  return nuevo;
}

export default function ResumenVistazo({ analisis, empresa }) {
  const [conteo, setConteo] = useState({ seguimiento: 0, cartera: 0, fuera: 0 });
  const [sentimiento, setSentimiento] = useState(null);
  const [total, setTotal] = useState(0);
  const [votoUsuario, setVotoUsuario] = useState(null);
  const [cargandoVoto, setCargandoVoto] = useState(true);

  useEffect(() => {
    if (!empresa?.ticker) return;
    const cookieId = obtenerOCrearCookieId();
    if (cookieId) {
      const guardado = document.cookie.match(
        new RegExp('(?:^|; )v3_voto_' + empresa.ticker + '=([^;]*)')
      );
      if (guardado) setVotoUsuario(decodeURIComponent(guardado[1]));
    }

    fetch(`/api/votos?ticker=${encodeURIComponent(empresa.ticker)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.conteo) setConteo(data.conteo);
        if (data.sentimiento) setSentimiento(data.sentimiento);
        if (typeof data.total === 'number') setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setCargandoVoto(false));
  }, [empresa?.ticker]);

  async function votar(opcion) {
    const cookieId = obtenerOCrearCookieId();
    if (!cookieId || !empresa?.ticker) return;

    try {
      const res = await fetch('/api/votos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: empresa.ticker, opcion, cookie_id: cookieId })
      });
      const data = await res.json();
      if (data.conteo) setConteo(data.conteo);
      if (data.sentimiento) setSentimiento(data.sentimiento);
      if (typeof data.total === 'number') setTotal(data.total);

      const unAnio = 60 * 60 * 24 * 365;
      document.cookie = `v3_voto_${empresa.ticker}=${encodeURIComponent(
        opcion
      )}; max-age=${unAnio}; path=/; SameSite=Lax`;
      setVotoUsuario(opcion);
    } catch (e) {}
  }

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

  const senales = analisis.senales || [];
  const ultima = senales.length > 0 ? senales[senales.length - 1] : null;

  let textoConsenso = 'sin votos';
  if (total > 0) {
    const max = Math.max(conteo.seguimiento, conteo.cartera, conteo.fuera);
    if (conteo.seguimiento === max) textoConsenso = 'en seguimiento';
    else if (conteo.cartera === max) textoConsenso = 'en cartera';
    else textoConsenso = 'fuera';
  }

  const etiqueta = {
    color: 'var(--v3-text-mute)',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: 600
  };
  const valor = { fontSize: '20px', fontWeight: 700, marginTop: '2px' };
  const sub = { color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '2px' };

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
        <div>
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

        <div>
          <div style={etiqueta}>Zona del indicador</div>
          <div style={{ ...valor, color: colorZona }}>{zona}</div>
          <div style={sub}>percentil {percentil} del rango de 60 sesiones</div>
        </div>

        <div>
          <div style={etiqueta}>Nivel de riesgo</div>
          <div style={{ ...valor, color: colorRiesgo }}>{riesgo}</div>
          <div style={sub}>calculado sobre el indicador</div>
        </div>

        <div>
          <div style={etiqueta}>Último movimiento</div>
          <div style={{ ...valor, color: 'var(--v3-text)' }}>
            {ultima ? ultima.tipo : '—'}
          </div>
          <div style={sub}>{ultima ? ultima.fecha : 'sin movimientos en el último año'}</div>
        </div>
      </div>

      <div
        style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--v3-border)'
        }}
      >
        <div style={{ ...etiqueta, marginBottom: '10px' }}>Consenso de la comunidad</div>
        {total > 0 && (
          <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
            <strong>Sentimiento agregado:</strong> {sentimiento || textoConsenso} · {total}{' '}
            {total === 1 ? 'voto' : 'votos'}
          </p>
        )}
        {total === 0 && (
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--v3-text-soft)' }}>
            Aún no hay votos. ¿Dónde tienes esta empresa?
          </p>
        )}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'seguimiento', etiqueta: 'En seguimiento' },
            { key: 'cartera', etiqueta: 'En cartera' },
            { key: 'fuera', etiqueta: 'Fuera' }
          ].map((op) => {
            const activo = votoUsuario === op.key;
            return (
              <button
                key={op.key}
                onClick={() => votar(op.key)}
                disabled={cargandoVoto}
                className={activo ? 'v3-btn' : 'v3-btn v3-btn-secondary'}
                style={{ fontSize: '13px', padding: '7px 12px' }}
              >
                {op.etiqueta} · {conteo[op.key] || 0}
              </button>
            );
          })}
        </div>

        <p style={{ color: 'var(--v3-text-mute)', fontSize: '12px', marginTop: '12px' }}>
          Voto único por navegador. No constituye una recomendación de inversión.
        </p>
      </div>
    </section>
  );
}
