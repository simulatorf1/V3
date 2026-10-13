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

export default function ConsensoComunidad({ ticker }) {
  const [conteo, setConteo] = useState({ seguimiento: 0, cartera: 0, fuera: 0 });
  const [sentimiento, setSentimiento] = useState(null);
  const [total, setTotal] = useState(0);
  const [votoUsuario, setVotoUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cookieId = obtenerOCrearCookieId();
    if (!cookieId) return;

    const guardado = document.cookie.match(new RegExp('(?:^|; )v3_voto_' + ticker + '=([^;]*)'));
    if (guardado) setVotoUsuario(decodeURIComponent(guardado[1]));

    fetch(`/api/votos?ticker=${encodeURIComponent(ticker)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.conteo) setConteo(data.conteo);
        if (data.sentimiento) setSentimiento(data.sentimiento);
        if (typeof data.total === 'number') setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [ticker]);

  async function votar(opcion) {
    const cookieId = obtenerOCrearCookieId();
    if (!cookieId) return;

    try {
      const res = await fetch('/api/votos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, opcion, cookie_id: cookieId })
      });
      const data = await res.json();
      if (data.conteo) setConteo(data.conteo);
      if (data.sentimiento) setSentimiento(data.sentimiento);
      if (typeof data.total === 'number') setTotal(data.total);

      const unAnio = 60 * 60 * 24 * 365;
      document.cookie = `v3_voto_${ticker}=${encodeURIComponent(opcion)}; max-age=${unAnio}; path=/; SameSite=Lax`;
      setVotoUsuario(opcion);
    } catch (e) {
      // silencio
    }
  }

  const opciones = [
    { key: 'seguimiento', etiqueta: 'En seguimiento' },
    { key: 'cartera', etiqueta: 'En cartera' },
    { key: 'fuera', etiqueta: 'Fuera' }
  ];

  return (
    <div style={{ marginTop: '40px' }}>
      <h2>Consenso de la comunidad</h2>

      <p style={{ color: '#666', fontSize: '13px', marginTop: '-8px' }}>
        Sin registro. Voto único por navegador. {total > 0 ? `${total} voto${total === 1 ? '' : 's'} registrado${total === 1 ? '' : 's'}.` : 'Aún no hay votos.'}
      </p>

      {sentimiento && (
        <p style={{ marginTop: '10px' }}>
          <strong>Sentimiento agregado:</strong> {sentimiento}
        </p>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '15px', flexWrap: 'wrap' }}>
        {opciones.map((op) => {
          const activo = votoUsuario === op.key;
          return (
            <button
              key={op.key}
              onClick={() => votar(op.key)}
              disabled={cargando}
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                border: activo ? '2px solid #0070f3' : '1px solid #ccc',
                background: activo ? '#e3f2fd' : '#fff',
                color: activo ? '#0070f3' : '#333',
                borderRadius: '6px',
                cursor: cargando ? 'wait' : 'pointer',
                fontWeight: activo ? 'bold' : 'normal'
              }}
            >
              {op.etiqueta} · {conteo[op.key] || 0}
            </button>
          );
        })}
      </div>

      <p style={{ color: '#666', fontSize: '13px', marginTop: '20px' }}>
        El consenso agregado refleja la opinión de los visitantes que han votado. No constituye una
        recomendación de inversión ni representa la posición de esta web.
      </p>
    </div>
  );
}
