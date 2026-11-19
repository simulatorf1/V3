'use client';

import { useState } from 'react';
import Link from 'next/link';

function formatPct(v) {
  if (v === null || v === undefined) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

function formatNum(v, dec = 2) {
  if (v === null || v === undefined) return '—';
  return Number(v).toFixed(dec);
}

function colorProb(pct) {
  if (pct === null || pct === undefined) return 'var(--v3-text-mute)';
  if (pct >= 60) return '#16a34a';
  if (pct <= 40) return '#dc2626';
  return '#f59e0b';
}

export default function ComparadorHome() {
  const [seleccionados, setSeleccionados] = useState([]);
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [datos, setDatos] = useState([]);
  const [noEncontrados, setNoEncontrados] = useState([]);
  const [cargando, setCargando] = useState(false);

  async function buscar(texto) {
    if (texto.trim().length < 2) { setResultados([]); return; }
    setBuscando(true);
    try {
      const res = await fetch(`/api/buscar?q=${encodeURIComponent(texto)}`);
      const json = await res.json();
      setResultados((json.resultados || []).slice(0, 6));
    } catch (e) { setResultados([]); }
    setBuscando(false);
  }

  function añadir(empresa) {
    if (seleccionados.length >= 3) return;
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
    if (nuevos.length > 0) cargarDatos(nuevos.map((s) => s.ticker));
    else { setDatos([]); setNoEncontrados([]); }
  }

  async function cargarDatos(tickers) {
    if (tickers.length === 0) { setDatos([]); setNoEncontrados([]); return; }
    setCargando(true);
    try {
      const res = await fetch(`/api/comparar?tickers=${tickers.join(',')}`);
      const json = await res.json();
      setDatos(json.empresas || []);
      setNoEncontrados(json.noEncontrados || []);
    } catch (e) { setDatos([]); setNoEncontrados([]); }
    setCargando(false);
  }

  const cellStyle = {
    padding: '12px 10px',
    borderBottom: '1px solid #222',
    fontSize: '13px'
  };
  const labelStyle = {
    ...cellStyle,
    fontWeight: 600,
    color: '#bbb',
    background: '#0f0f0f'
  };
  const headerStyle = {
    padding: '12px 10px',
    textAlign: 'left',
    borderBottom: '1px solid #333',
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    color: '#888'
  };

  return (
    <div>
      {seleccionados.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {seleccionados.map((s) => (
            <span key={s.ticker} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '999px', fontSize: '13px', fontWeight: 600 }}>
              {s.nombre}
              <button onClick={() => quitar(s.ticker)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontWeight: 700, padding: 0 }}>×</button>
            </span>
          ))}
        </div>
      )}

      {seleccionados.length < 3 && (
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); buscar(e.target.value); }}
            placeholder="Busca una empresa por nombre (ej. Telefónica, Santander...)"
            style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '1px solid #333', background: '#111', color: '#fff', borderRadius: '6px', outline: 'none' }}
          />
          {buscando && <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Buscando...</div>}
          {resultados.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#111', border: '1px solid #333', borderRadius: '6px', marginTop: '4px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
              {resultados.map((r) => (
                <button key={r.ticker} onClick={() => añadir(r)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', background: 'none', border: 'none', borderBottom: '1px solid #222', cursor: 'pointer', fontSize: '13px', color: '#fff' }}>
                  <strong>{r.nombre}</strong> <span style={{ color: '#888' }}>({r.ticker})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {noEncontrados.length > 0 && (
        <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>Sin datos para: {noEncontrados.join(', ')}</p>
      )}

      {cargando && <p style={{ fontSize: '13px', color: '#888', marginTop: '12px' }}>Cargando comparación...</p>}

      {datos.length > 0 && !cargando && (
        <div style={{ overflowX: 'auto', marginTop: '16px', background: '#0a0a0a', border: '1px solid #222', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#fff' }}>
            <thead>
              <tr>
                <th style={headerStyle}>Métrica</th>
                {datos.map((f) => (
                  <th key={f.ticker} style={headerStyle}>
                    <Link href={`/analisis/${f.ticker.toLowerCase()}`} style={{ color: '#fff', textDecoration: 'none' }}>
                      {f.nombre}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* BLOQUE 1: PROBABILIDADES (lo que el usuario busca) */}
              <tr>
                <td colSpan={datos.length + 1} style={{ padding: '10px', background: '#111', color: '#888', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #222' }}>
                  Probabilidad histórica
                </td>
              </tr>
              <tr>
                <td style={labelStyle}>% subidas diario</td>
                {datos.map((f) => (
                  <td key={f.ticker} style={{ ...cellStyle, color: colorProb(f.pctSubidasDiario), fontWeight: 800, fontSize: '16px' }}>
                    {f.pctSubidasDiario !== null ? `${f.pctSubidasDiario}%` : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={labelStyle}>Casos diario</td>
                {datos.map((f) => <td key={f.ticker} style={cellStyle}>{f.casosDiario ?? '—'}</td>)}
              </tr>
              <tr>
                <td style={labelStyle}>Retorno medio diario</td>
                {datos.map((f) => <td key={f.ticker} style={{ ...cellStyle, color: f.retornoMedioDiario >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{formatPct(f.retornoMedioDiario)}</td>)}
              </tr>
              <tr>
                <td style={labelStyle}>% subidas semanal</td>
                {datos.map((f) => (
                  <td key={f.ticker} style={{ ...cellStyle, color: colorProb(f.pctSubidasSemanal), fontWeight: 800, fontSize: '16px' }}>
                    {f.pctSubidasSemanal !== null ? `${f.pctSubidasSemanal}%` : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={labelStyle}>Casos semanal</td>
                {datos.map((f) => <td key={f.ticker} style={cellStyle}>{f.casosSemanal ?? '—'}</td>)}
              </tr>
              <tr>
                <td style={labelStyle}>Retorno medio semanal</td>
                {datos.map((f) => <td key={f.ticker} style={{ ...cellStyle, color: f.retornoMedioSemanal >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{formatPct(f.retornoMedioSemanal)}</td>)}
              </tr>

              {/* BLOQUE 2: SITUACIÓN ACTUAL */}
              <tr>
                <td colSpan={datos.length + 1} style={{ padding: '10px', background: '#111', color: '#888', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #222', borderTop: '1px solid #333' }}>
                  Situación actual
                </td>
              </tr>
              <tr>
                <td style={labelStyle}>Precio</td>
                {datos.map((f) => <td key={f.ticker} style={cellStyle}>{f.precio !== null ? `${formatNum(f.precio)} €` : '—'}</td>)}
              </tr>
              <tr>
                <td style={labelStyle}>Zona</td>
                {datos.map((f) => <td key={f.ticker} style={cellStyle}>{f.zona || '—'}</td>)}
              </tr>
              <tr>
                <td style={labelStyle}>Indicador Equaty</td>
                {datos.map((f) => <td key={f.ticker} style={cellStyle}>{f.smiActual !== null ? formatNum(f.smiActual, 0) : '—'}</td>)}
              </tr>
              <tr>
                <td style={labelStyle}>Percentil</td>
                {datos.map((f) => <td key={f.ticker} style={cellStyle}>{f.percentil ?? '—'}</td>)}
              </tr>
              <tr>
                <td style={labelStyle}>Var. 60 sesiones</td>
                {datos.map((f) => <td key={f.ticker} style={cellStyle}>{formatPct(f.variacion60)}</td>)}
              </tr>

              {/* BLOQUE 3: INDICADORES TÉCNICOS */}
              <tr>
                <td colSpan={datos.length + 1} style={{ padding: '10px', background: '#111', color: '#888', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #222', borderTop: '1px solid #333' }}>
                  Indicadores técnicos
                </td>
              </tr>
              <tr>
                <td style={labelStyle}>Volatilidad diaria</td>
                {datos.map((f) => <td key={f.ticker} style={cellStyle}>{f.volatilidad !== null ? `${formatNum(f.volatilidad, 2)}%` : '—'}</td>)}
              </tr>
              <tr>
                <td style={labelStyle}>Ratio alcistas</td>
                {datos.map((f) => <td key={f.ticker} style={cellStyle}>{f.ratioAlcistas !== null ? `${formatNum(f.ratioAlcistas, 1)}%` : '—'}</td>)}
              </tr>
              <tr>
                <td style={labelStyle}>Racha actual</td>
                {datos.map((f) => <td key={f.ticker} style={cellStyle}>{f.racha > 0 ? `${f.racha} ${f.direccionRacha}` : '—'}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <p style={{ fontSize: '11px', color: '#666', marginTop: '12px', lineHeight: 1.5 }}>
        Datos históricos descriptivos. No es una predicción ni una recomendación de inversión.
      </p>
    </div>
  );
}
