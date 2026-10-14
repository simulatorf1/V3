'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Buscador() {
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

  return (
    <div className="v3-card" style={{ marginTop: '20px' }}>
      <form onSubmit={buscar} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca por nombre o ticker (ej. Microsoft, Apple, Audax)"
          style={{
            flex: 1,
            minWidth: '220px',
            padding: '12px 14px',
            fontSize: '15px',
            border: '1px solid var(--v3-border-strong)',
            borderRadius: 'var(--v3-radius-sm)',
            outline: 'none'
          }}
        />
        <button type="submit" className="v3-btn">
          Buscar
        </button>
      </form>

      {cargando && (
        <p style={{ color: 'var(--v3-text-soft)', marginTop: '16px' }}>Buscando…</p>
      )}

      {buscado && !cargando && resultados.length === 0 && (
        <p style={{ color: 'var(--v3-text-soft)', marginTop: '16px' }}>
          No se han encontrado datos suficientes para esta empresa. Prueba con otro nombre o
          ticker.
        </p>
      )}

      {resultados.length > 0 && (
        <ul className="v3-lista" style={{ marginTop: '16px' }}>
          {resultados.map((r) => (
            <li key={r.ticker}>
              <Link href={`/analisis/${construirSlug(r)}`}>
                <span>
                  <strong>{r.nombre}</strong>{' '}
                  <span style={{ color: 'var(--v3-text-soft)' }}>({r.ticker})</span>
                  {r.mercado && (
                    <span style={{ color: 'var(--v3-text-mute)' }}> · {r.mercado}</span>
                  )}
                </span>
                {r.tipo && <span className="v3-tag">{r.tipo}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
