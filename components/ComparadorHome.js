'use client';

import { useState } from 'react';
import Link from 'next/link';

function formatPct(v) {
  if (v === null || v === undefined) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

export default function ComparadorHome() {
  const [seleccionados, setSeleccionados] = useState([]);
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(false);

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

  function añadir(empresa) {
    if (seleccionados.length >= 4) return;
    if (seleccionados.find((s) => s.ticker === empresa.ticker)) return;
    const nuevos = [...seleccionados, empresa];
    setSeleccionados(nuevos);
    setQuery('');
    setResultados([]);
    cargarDatos(nuevos.map((s) => s.ticker));
  }

  function quitar(ticker) {
    const nuevos = seleccionados.filter((s) => s.ticker !== ticker);
    setSeleccionados(nuevos);
    if (nuevos.length > 0) {
      cargarDatos(nuevos.map((s) => s.ticker));
    } else {
      setDatos([]);
    }
  }

  async function cargarDatos(tickers) {
    if (tickers.length === 0) {
      setDatos([]);
      return;
    }
    setCargando(true);
    try {
      const res = await fetch(`/api/comparar?tickers=${tickers.join(',')}`);
      const json = await res.json();
      setDatos(json.filas || []);
    } catch (e) {
      setDatos([]);
    }
    setCargando(false);
  }

  return (
    <div>
      {/* Empresas seleccionadas */}
      {seleccionados.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {seleccionados.map((s) => (
            <span
              key={s.ticker}
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
              {s.nombre}
              <button
                onClick={() => quitar(s.ticker)}
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
                  onClick={() => añadir(r)}
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

      {/* Tabla comparativa */}
      {cargando && <p style={{ fontSize: '13px', color: 'var(--v3-text-mute)', marginTop: '12px' }}>Cargando comparación...</p>}

      {datos.length > 0 && !cargando && (
        <div style={{ overflowX: 'auto', marginTop: '16px' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              background: '#fff',
              border: '1px solid var(--v3-border)',
              borderRadius: '8px'
            }}
          >
            <thead>
              <tr style={{ background: 'var(--v3-bg-soft)' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid var(--v3-border)' }}>Métrica</th>
                {datos.map((f) => (
                  <th key={f.ticker} style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid var(--v3-border)' }}>
                    <Link href={`/analisis/${f.slug}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                      {f.nombre}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Percentil 60</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{f.percentil ?? '—'}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Zona</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{f.zona || '—'}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Var. 60 sesiones</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{formatPct(f.variacion60)}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Casos diario</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{f.casos_diario ?? '—'}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>% subidas diario</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{f.pct_subidas_diario !== null ? `${f.pct_subidas_diario}%` : '—'}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Retorno medio diario</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{formatPct(f.retorno_medio_diario)}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Casos semanal</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{f.casos_semanal ?? '—'}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>% subidas semanal</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{f.pct_subidas_semanal !== null ? `${f.pct_subidas_semanal}%` : '—'}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', fontWeight: 600 }}>Retorno medio semanal</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px' }}>{formatPct(f.retorno_medio_semanal)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
