'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import FormularioAlerta from './FormularioAlerta';

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
      <aside style={{ fontSize: '13px', color: 'var(--v3-text-soft)' }}>Cargando…</aside>
    );
  }

  const tituloSeccion = {
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--v3-text-mute)',
    margin: '0 0 10px 0'
  };

  return (
    <aside style={{ fontSize: '14px' }}>
      {datos.relacionados.length > 0 && (
        <section style={{ marginBottom: '28px' }}>
          <h3 style={tituloSeccion}>Del mismo sector</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {datos.relacionados.map((e) => (
              <li key={e.ticker} style={{ marginBottom: '8px' }}>
                <Link
                  href={`/analisis/${slugEmpresa(e)}`}
                  style={{ color: 'var(--v3-text)', fontWeight: 500 }}
                >
                  {e.nombre}{' '}
                  <span style={{ color: 'var(--v3-text-mute)' }}>({e.ticker})</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {datos.top.length > 0 && (
        <section style={{ marginBottom: '28px' }}>
          <h3 style={tituloSeccion}>Más consultados esta semana</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {datos.top.map((e) => (
              <li key={e.ticker} style={{ marginBottom: '8px' }}>
                <Link
                  href={`/analisis/${slugEmpresa(e)}`}
                  style={{ color: 'var(--v3-text)', fontWeight: 500 }}
                >
                  {e.nombre}{' '}
                  <span style={{ color: 'var(--v3-text-mute)' }}>({e.ticker})</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {datos.noticias.length > 0 && (
        <section style={{ marginBottom: '28px' }}>
          <h3 style={tituloSeccion}>Noticias relacionadas</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {datos.noticias.map((n, i) => (
              <li key={i} style={{ marginBottom: '12px' }}>
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  style={{
                    color: 'var(--v3-text)',
                    fontSize: '13px',
                    lineHeight: 1.4,
                    fontWeight: 500
                  }}
                >
                  {n.titulo}
                </a>
                {n.fuente && (
                  <div style={{ color: 'var(--v3-text-mute)', fontSize: '11px', marginTop: '3px' }}>
                    {n.fuente}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section style={{ marginBottom: '28px' }}>
        <FormularioAlerta empresa={{ ticker: ticker, nombre: ticker }} variante="sidebar" />
      </section>
      <section
        style={{
          border: '1px dashed var(--v3-border-strong)',
          borderRadius: 'var(--v3-radius-sm)',
          padding: '20px',
          textAlign: 'center',
          color: 'var(--v3-text-mute)',
          fontSize: '12px'
        }}
      >
        Espacio publicitario
      </section>
    </aside>
  );
}
