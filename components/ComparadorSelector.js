'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ComparadorSelector({ tickersIniciales = [] }) {
  const [seleccionados, setSeleccionados] = useState(tickersIniciales);
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const router = useRouter();

  async function buscar(texto) {
    if (texto.trim().length < 2) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    try {
      const res = await fetch(`/api/buscar?q=${encodeURIComponent(texto)}`);
      const json = await res.json();
      setResultados((json.resultados || []).slice(0, 6));
    } catch (e) {
      setResultados([]);
    }
    setBuscando(false);
  }

  function añadir(ticker) {
    if (seleccionados.length >= 4) return;
    if (seleccionados.includes(ticker)) return;
    const nuevos = [...seleccionados, ticker];
    setSeleccionados(nuevos);
    setQuery('');
    setResultados([]);
  }

  function quitar(ticker) {
    setSeleccionados(seleccionados.filter((t) => t !== ticker));
  }

  function comparar() {
    if (seleccionados.length === 0) return;
    router.push(`/comparar?tickers=${seleccionados.join(',')}`);
  }

  return (
    <div style={{ marginTop: '16px' }}>
      {/* Empresas seleccionadas */}
      {seleccionados.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {seleccionados.map((t) => (
            <span
              key={t}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: '#dbeafe',
                color: '#1e40af',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              {t}
              <button
                onClick={() => quitar(t)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e40af', fontWeight: 700, padding: 0 }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Buscador */}
      {seleccionados.length < 4 && (
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); buscar(e.target.value); }}
            placeholder="Busca una empresa por nombre (ej. Telefónica, Santander...)"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              border: '1px solid var(--v3-border)',
              borderRadius: '6px'
            }}
          />
          {buscando && <div style={{ fontSize: '12px', color: 'var(--v3-text-mute)', marginTop: '4px' }}>Buscando...</div>}
          {resultados.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#fff',
                border: '1px solid var(--v3-border)',
                borderRadius: '6px',
                marginTop: '4px',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {resultados.map((r) => (
                <button
                  key={r.ticker}
                  onClick={() => añadir(r.ticker)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid var(--v3-border)',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  <strong>{r.nombre}</strong> <span style={{ color: 'var(--v3-text-mute)' }}>({r.ticker})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={comparar}
        disabled={seleccionados.length === 0}
        style={{
          marginTop: '12px',
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: 600,
          background: seleccionados.length > 0 ? '#2563eb' : '#9ca3af',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: seleccionados.length > 0 ? 'pointer' : 'not-allowed'
        }}
      >
        Comparar {seleccionados.length > 0 ? `(${seleccionados.length})` : ''}
      </button>
    </div>
  );
}
