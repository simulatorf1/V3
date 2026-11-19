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

export default function ComparadorHome() {
  const [seleccionados, setSeleccionados] = useState([]);
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [datos, setDatos] = useState([]);
  const [noEncontrados, setNoEncontrados] = useState([]);
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
    if (seleccionados.length >= 3) return; // tu API limita a 3
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
      setNoEncontrados([]);
    }
  }

  async function cargarDatos(tickers) {
    if (tickers.length === 0) {
      setDatos([]);
      setNoEncontrados([]);
      return;
    }
    setCargando(true);
    try {
      const res = await fetch(`/api/comparar?tickers=${tickers.join(',')}`);
      const json = await res.json();
      setDatos(json.empresas || []);
      setNoEncontrados(json.noEncontrados || []);
    } catch (e) {
      setDatos([]);
      setNoEncontrados([]);
    }
    setCargando(false);
  }

  return (
    <div>
      {/* Seleccionados */}
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
      {seleccionados.length < 3 && (
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

      {/* No encontrados */}
      {noEncontrados.length > 0 && (
        <p style={{ fontSize: '12px', color: 'var(--v3-text-mute)', marginTop: '8px' }}>
          Sin datos para: {noEncontrados.join(', ')}
        </p>
      )}

      {cargando && <p style={{ fontSize: '13px', color: 'var(--v3-text-mute)', marginTop: '12px' }}>Cargando comparación...</p>}

      {/* Tabla comparativa con todas las métricas de tu API */}
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
                    <Link href={`/analisis/${f.ticker.toLowerCase()}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                      {f.nombre}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Precio</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{f.precio !== null ? `${formatNum(f.precio)} €` : '—'}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Zona</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{f.zona || '—'}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Indicador Equaty</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{f.smiActual !== null ? formatNum(f.smiActual, 0) : '—'}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Percentil</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{f.percentil ?? '—'}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Var. 5 sesiones</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{formatPct(f.variacion5)}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Var. 60 sesiones</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{formatPct(f.variacion60)}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Posición en rango</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{f.posicionRango !== null ? `${formatNum(f.posicionRango, 1)}%` : '—'}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Amplitud rango</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{f.amplitudRango !== null ? `${formatNum(f.amplitudRango, 1)}%` : '—'}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Volatilidad diaria</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{f.volatilidad !== null ? `${formatNum(f.volatilidad, 2)}%` : '—'}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Volatilidad semanal</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{f.volatilidadSemanal !== null ? `${formatNum(f.volatilidadSemanal, 2)}%` : '—'}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Ratio alcistas</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{f.ratioAlcistas !== null ? `${formatNum(f.ratioAlcistas, 1)}%` : '—'}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Racha actual</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{f.racha > 0 ? `${f.racha} ${f.direccionRacha}` : '—'}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Pendiente indicador</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{formatPct(f.pendienteIndicador)}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', fontWeight: 600 }}>Cambios de zona (60)</td>
                {datos.map((f) => <td key={f.ticker} style={{ padding: '10px' }}>{f.cambiosZona60 ?? '—'}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <p style={{ fontSize: '11px', color: 'var(--v3-text-mute)', marginTop: '12px', lineHeight: 1.5 }}>
        Datos históricos descriptivos. No es una predicción ni una recomendación de inversión.
      </p>
    </div>
  );
}
