'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

function slugEmpresa(e) {
  const nombreLimpio = (e.nombre || e.ticker)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${e.ticker.toLowerCase()}__${nombreLimpio}`;
}

export default function BarraLateral({ ticker }) {
  const [datos, setDatos] = useState({ relacionados: [], top: [], noticias: [] });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!ticker) return;
    fetch(`/api/sidebar?ticker=${encodeURIComponent(ticker)}`)
      .then((r) => r.json())
      .then((d) => setDatos(d))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [ticker]);

  if (cargando) {
    return (
      <aside style={{ fontSize: '13px', color: '#666' }}>
        Cargando…
      </aside>
    );
  }

  return (
    <aside style={{ fontSize: '14px' }}>
      {/* Empresas relacionadas */}
      {datos.relacionados.length > 0 && (
        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '15px', marginTop: 0 }}>Del mismo sector</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {datos.relacionados.map((e) => (
              <li key={e.ticker} style={{ marginBottom: '8px' }}>
                <Link
                  href={`/analisis/${slugEmpresa(e)}`}
                  style={{ color: '#0070f3', textDecoration: 'none' }}
                >
                  {e.nombre} <span style={{ color: '#666' }}>({e.ticker})</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Más consultados */}
      {datos.top.length > 0 && (
        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '15px' }}>Más consultados esta semana</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {datos.top.map((e) => (
              <li key={e.ticker} style={{ marginBottom: '8px' }}>
                <Link
                  href={`/analisis/${slugEmpresa(e)}`}
                  style={{ color: '#0070f3', textDecoration: 'none' }}
                >
                  {e.nombre} <span style={{ color: '#666' }}>({e.ticker})</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Noticias relacionadas */}
      {datos.noticias.length > 0 && (
        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '15px' }}>Noticias relacionadas</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {datos.noticias.map((n, i) => (
              <li key={i} style={{ marginBottom: '10px' }}>
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  style={{
                    color: '#111',
                    textDecoration: 'none',
                    fontSize: '13px',
                    lineHeight: '1.4'
                  }}
                >
                  {n.titulo}
                </a>
                {n.fuente && (
                  <div style={{ color: '#999', fontSize: '11px', marginTop: '2px' }}>
                    {n.fuente}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Espacio publicitario reservado para AdSense (paso 26) */}
      <section
        style={{
          border: '1px dashed #ddd',
          borderRadius: '6px',
          padding: '20px',
          textAlign: 'center',
          color: '#999',
          fontSize: '12px'
        }}
      >
        Espacio publicitario
      </section>
    </aside>
  );
}
