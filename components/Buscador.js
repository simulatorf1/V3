'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

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

    const { data, error } = await supabase
      .from('empresas')
      .select('ticker, nombre, sector, mercado')
      .or(`ticker.ilike.%${query}%,nombre.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error(error);
      setResultados([]);
    } else {
      setResultados(data || []);
    }
    setCargando(false);
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <form onSubmit={buscar} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca por nombre o ticker (ej. Microsoft, MSTF)"
          style={{
            flex: 1,
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '6px'
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            background: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Buscar
        </button>
      </form>

      {cargando && <p>Buscando…</p>}

      {buscado && !cargando && resultados.length === 0 && (
        <p style={{ color: '#666', marginTop: '16px' }}>
          No se han encontrado datos suficientes para esta empresa. Prueba con otro nombre o ticker.
        </p>
      )}

      {resultados.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '16px' }}>
          {resultados.map((r) => (
            <li
              key={r.ticker}
              style={{
                padding: '12px',
                border: '1px solid #eee',
                borderRadius: '6px',
                marginBottom: '8px'
              }}
            >
              <strong>{r.nombre}</strong> ({r.ticker})
              {r.sector && <span style={{ color: '#666' }}> — {r.sector}</span>}
              {r.mercado && <span style={{ color: '#666' }}> · {r.mercado}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
