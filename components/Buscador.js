'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Buscador({ dark = false }) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [buscado, setBuscado] = useState(false);

  async function buscar(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setCargando(true);
    setBuscado(true);

    try {
      const res = await fetch(`/api/buscar?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      setResultados(json.resultados || []);
    } catch (err) {
      console.error(err);
      setResultados([]);
    }
    setCargando(false);
  }

  function construirSlug(empresa) {
    const nombreLimpio = empresa.nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${empresa.ticker.toLowerCase()}__${nombreLimpio}`;
  }

  // Estilos condicionales según el modo
  const estilos = dark
    ? {
        card: {
          background: '#141414',
          border: '1px solid #222',
          borderRadius: '8px',
          padding: '20px'
        },
        input: {
          flex: '1 1 260px',
          maxWidth: '420px',
          padding: '12px 14px',
          fontSize: '14px',
          border: '1px solid #333',
          background: '#111',
          color: '#f5f5f5',
          borderRadius: '6px',
          outline: 'none'
        },
        boton: {
          padding: '12px 20px',
          background: '#f5f5f5',
          color: '#0a0a0a',
          border: 'none',
          borderRadius: '6px',
          fontWeight: 700,
          fontSize: '14px',
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        },
        linkHoy: {
          display: 'inline-flex',
          alignItems: 'center',
          padding: '12px 20px',
          background: '#3b82f6',
          color: '#fff',
          borderRadius: '6px',
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: '14px',
          whiteSpace: 'nowrap'
        },
        texto: '#a3a3a3',
        textoMute: '#666',
        listaItem: {
          borderBottom: '1px solid #222',
          padding: '12px 0'
        },
        link: '#f5f5f5',
        tag: {
          background: '#222',
          color: '#a3a3a3',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 600
        }
      }
    : {
        card: { marginTop: '20px' },
        input: {
          flex: '1 1 260px',
          maxWidth: '420px',
          padding: '10px 14px',
          fontSize: '14px',
          border: '1px solid var(--v3-border-strong)',
          borderRadius: 'var(--v3-radius-sm)',
          outline: 'none'
        },
        boton: null, // usará la clase v3-btn
        linkHoy: {
          display: 'inline-flex',
          alignItems: 'center',
          padding: '10px 16px',
          background: '#2563eb',
          color: '#fff',
          borderRadius: 'var(--v3-radius-sm)',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '14px',
          whiteSpace: 'nowrap'
        },
        texto: 'var(--v3-text-soft)',
        textoMute: 'var(--v3-text-mute)',
        listaItem: {},
        link: 'inherit',
        tag: null
      };

  return (
    <div style={estilos.card} className={dark ? '' : 'v3-card'}>
      <form
        onSubmit={buscar}
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          alignItems: 'stretch'
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca por nombre o ticker (ej. Microsoft, Apple, Audax)"
          style={estilos.input}
        />
        {dark ? (
          <button type="submit" style={estilos.boton}>
            Buscar
          </button>
        ) : (
          <button type="submit" className="v3-btn" style={{ whiteSpace: 'nowrap' }}>
            Buscar
          </button>
        )}
        <Link href="/hoy" style={estilos.linkHoy}>
          Ver resumen de hoy →
        </Link>
      </form>

      {cargando && (
        <p style={{ color: estilos.texto, marginTop: '16px' }}>Buscando…</p>
      )}

      {buscado && !cargando && resultados.length === 0 && (
        <p style={{ color: estilos.texto, marginTop: '16px' }}>
          No se han encontrado datos suficientes para esta empresa. Prueba con otro nombre o
          ticker.
        </p>
      )}

      {resultados.length > 0 && (
        <ul
          style={{
            marginTop: '16px',
            listStyle: 'none',
            padding: 0,
            margin: '16px 0 0'
          }}
        >
          {resultados.map((r) => (
            <li key={r.ticker} style={estilos.listaItem}>
              <Link
                href={`/analisis/${construirSlug(r)}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: estilos.link,
                  padding: dark ? '8px 0' : undefined
                }}
              >
                <span>
                  <strong>{r.nombre}</strong>{' '}
                  <span style={{ color: estilos.textoMute }}>({r.ticker})</span>
                  {r.mercado && (
                    <span style={{ color: estilos.textoMute }}> · {r.mercado}</span>
                  )}
                </span>
                {r.tipo && (
                  dark ? (
                    <span style={estilos.tag}>{r.tipo}</span>
                  ) : (
                    <span className="v3-tag">{r.tipo}</span>
                  )
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
