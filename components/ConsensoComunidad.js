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
    } catch (e) {}
  }

  const opciones = [
    { key: 'seguimiento', etiqueta: 'En seguimiento' },
    { key: 'cartera', etiqueta: 'En cartera' },
    { key: 'fuera', etiqueta: 'Fuera' }
  ];

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Consenso de la comunidad</h2>

      <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px' }}>
        Sin registro. Voto único por navegador.{' '}
        {total > 0
          ? `${total} voto${total === 1 ? '' : 's'} registrado${total === 1 ? '' : 's'}.`
          : 'Aún no hay votos.'}
      </p>

      {sentimiento && (
        <p>
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
              className={activo ? 'v3-btn' : 'v3-btn v3-btn-secondary'}
            >
              {op.etiqueta} · {conteo[op.key] || 0}
            </button>
          );
        })}
      </div>

      <p style={{ color: 'var(--v3-text-mute)', fontSize: '13px', marginTop: '16px' }}>
        El consenso agregado refleja la opinión de los visitantes que han votado. No constituye una
        recomendación de inversión ni representa la posición de esta web.
      </p>
    </section>
  );
}
