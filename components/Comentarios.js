'use client';

import { useEffect, useState } from 'react';

function fechaRelativa(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const ahora = new Date();
    const diffMin = Math.floor((ahora - d) / 60000);
    if (diffMin < 1) return 'ahora mismo';
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `hace ${diffH} h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 30) return `hace ${diffD} d`;
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    return '';
  }
}

export default function Comentarios({ ticker, nombreEmpresa }) {
  const [comentarios, setComentarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [texto, setTexto] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    if (!ticker) return;
    fetch(`/api/comentarios?ticker=${encodeURIComponent(ticker)}`)
      .then((r) => r.json())
      .then((d) => setComentarios(d.comentarios || []))
      .catch(() => setComentarios([]))
      .finally(() => setCargando(false));
  }, [ticker]);

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    setExito(false);

    if (!texto.trim()) {
      setError('Escribe un comentario.');
      return;
    }
    if (texto.trim().length > 1500) {
      setError('Máximo 1500 caracteres.');
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch('/api/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, texto: texto.trim(), honeypot })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo publicar.');
        setEnviando(false);
        return;
      }
      if (data.comentario) {
        setComentarios([data.comentario, ...comentarios]);
      }
      setTexto('');
      setExito(true);
      setTimeout(() => setExito(false), 4000);
    } catch (e) {
      setError('Error de conexión.');
    }
    setEnviando(false);
  }

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Comentarios ({comentarios.length})</h2>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '-4px' }}>
        Opiniones de visitantes sobre {nombreEmpresa}. No son análisis ni recomendaciones de
        inversión. Los comentarios se publican automáticamente y pueden ser moderados.
      </p>

      <div className="v3-card" style={{ padding: '16px', marginTop: '12px' }}>
        <form onSubmit={enviar}>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe tu comentario…"
            rows={3}
            maxLength={1500}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              border: '1px solid var(--v3-border-strong)',
              borderRadius: 'var(--v3-radius-sm)',
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
            disabled={enviando}
          />

          {/* Honeypot oculto, no rellenar */}
          <input
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            style={{
              position: 'absolute',
              left: '-9999px',
              width: '1px',
              height: '1px',
              opacity: 0
            }}
            aria-hidden="true"
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '8px',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--v3-text-mute)' }}>
              {texto.length} / 1500 caracteres
            </span>
            <button
              type="submit"
              disabled={enviando}
              className="v3-btn"
              style={{ minWidth: '120px' }}
            >
              {enviando ? 'Publicando…' : 'Publicar comentario'}
            </button>
          </div>

          {error && (
            <p style={{ color: '#b91c1c', fontSize: '12px', marginTop: '8px', marginBottom: 0 }}>
              {error}
            </p>
          )}
          {exito && (
            <p style={{ color: '#16a34a', fontSize: '12px', marginTop: '8px', marginBottom: 0 }}>
              ✓ Comentario publicado.
            </p>
          )}
        </form>
      </div>

      {cargando ? (
        <p style={{ color: 'var(--v3-text-soft)', marginTop: '16px', fontSize: '13px' }}>
          Cargando comentarios…
        </p>
      ) : comentarios.length === 0 ? (
        <p style={{ color: 'var(--v3-text-soft)', marginTop: '16px', fontSize: '13px' }}>
          Aún no hay comentarios. Sé el primero en opinar.
        </p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '16px 0 0 0',
            display: 'grid',
            gap: '10px'
          }}
        >
          {comentarios.map((c) => (
            <li
              key={c.id}
              style={{
                padding: '12px 14px',
                background: '#fff',
                border: '1px solid var(--v3-border)',
                borderRadius: 'var(--v3-radius-sm)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: 'var(--v3-text-mute)',
                  marginBottom: '6px'
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--v3-text-soft)' }}>
                  Visitante {c.autor}
                </span>
                <span>{fechaRelativa(c.created_at)}</span>
              </div>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {c.texto}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
