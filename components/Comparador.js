'use client';

import { useEffect, useState } from 'react';

function situacionDesdeZona(zona) {
  if (zona === 'alta') return 'parte alta';
  if (zona === 'baja') return 'parte baja';
  return 'parte intermedia';
}

function fmtPct(v, decimales = 2) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(decimales)}%`;
}

function fmtPrecio(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return `${Number(v).toFixed(2)} €`;
}

function BarraComparativa({ etiqueta, valores, min, max }) {
  // valores: array de { ticker, nombre, valor }
  return (
    <div style={{ marginBottom: '14px' }}>
      <div
        style={{
          fontSize: '11.5px',
          color: 'var(--v3-text-soft)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
          marginBottom: '6px'
        }}
      >
        {etiqueta}
      </div>
      <div style={{ display: 'grid', gap: '6px' }}>
        {valores.map((v) => {
          const val = v.valor;
          const clamped =
            val === null || val === undefined
              ? null
              : Math.max(min, Math.min(max, val));
          let pct = 0;
          let ceroPct = min < 0 && max > 0 ? ((0 - min) / (max - min)) * 100 : 0;
          if (clamped !== null) {
            pct = ((clamped - min) / (max - min)) * 100;
          }
          const izquierda = Math.min(ceroPct, pct);
          const ancho = Math.abs(pct - ceroPct);
          const color =
            clamped === null ? '#e5e7eb' : clamped >= 0 ? '#2563eb' : '#9ca3af';

          return (
            <div
              key={v.ticker}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--v3-text-soft)',
                  width: '90px',
                  flexShrink: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                title={v.nombre}
              >
                {v.ticker}
              </div>
              <div
                style={{
                  position: 'relative',
                  flex: 1,
                  height: '14px',
                  background: 'var(--v3-bg-soft)',
                  border: '1px solid var(--v3-border)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: `${ceroPct}%`,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    background: 'rgba(0,0,0,0.25)'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: `${izquierda}%`,
                    top: 0,
                    bottom: 0,
                    width: `${ancho}%`,
                    background: color
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  width: '70px',
                  textAlign: 'right',
                  flexShrink: 0
                }}
              >
                {val === null || val === undefined
                  ? '—'
                  : etiqueta.toLowerCase().includes('precio')
                  ? fmtPrecio(val)
                  : etiqueta.toLowerCase().includes('percentil')
                  ? val
                  : fmtPct(val)}
              </div>
            </div>
          );
        })}
      </div>
      {min !== undefined && max !== undefined && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: 'var(--v3-text-mute)',
            marginTop: '2px'
          }}
        >
          <span>{min}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}

export default function Comparador({ tickerActual, nombreActual }) {
  const [tickers, setTickers] = useState([tickerActual]);
  const [inputTicker, setInputTicker] = useState('');
  const [empresas, setEmpresas] = useState([]);
  const [noEncontrados, setNoEncontrados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (tickers.length === 0) return;
    setCargando(true);
    setError(null);
    fetch(`/api/comparar?tickers=${tickers.join(',')}`)
      .then((r) => r.json())
      .then((d) => {
        setEmpresas(d.empresas || []);
        setNoEncontrados(d.noEncontrados || []);
      })
      .catch((e) => {
        setError('No se pudieron cargar los datos.');
      })
      .finally(() => setCargando(false));
  }, [tickers.join(',')]);

  function agregarTicker() {
    const t = inputTicker.trim().toUpperCase();
    if (!t) return;
    if (tickers.includes(t)) {
      setInputTicker('');
      return;
    }
    if (tickers.length >= 3) {
      setInputTicker('');
      return;
    }
    setTickers([...tickers, t]);
    setInputTicker('');
  }

  function quitarTicker(t) {
    if (t === tickerActual) return;
    setTickers(tickers.filter((x) => x !== t));
  }

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Comparar con otras empresas</h2>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '-4px' }}>
        Añade hasta 2 tickers más para comparar sus datos. Dato descriptivo, no recomendación.
      </p>

      <div
        className="v3-card"
        style={{ padding: '16px', marginTop: '12px', overflow: 'hidden' }}
      >
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '12px'
          }}
        >
          {tickers.map((t) => {
            const emp = empresas.find((e) => e.ticker === t);
            const esActual = t === tickerActual;
            return (
              <span
                key={t}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  background: esActual ? '#2563eb' : 'var(--v3-bg-soft)',
                  color: esActual ? '#fff' : 'var(--v3-text)',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                {t}
                {!esActual && (
                  <button
                    onClick={() => quitarTicker(t)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '14px'
                    }}
                    aria-label="Quitar"
                  >
                    ×
                  </button>
                )}
              </span>
            );
          })}

          {tickers.length < 3 && (
            <div style={{ display: 'inline-flex', gap: '6px' }}>
              <input
                type="text"
                value={inputTicker}
                onChange={(e) => setInputTicker(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    agregarTicker();
                  }
                }}
                placeholder="Añadir ticker"
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  border: '1px solid var(--v3-border-strong)',
                  borderRadius: '999px',
                  outline: 'none',
                  width: '130px'
                }}
              />
              <button
                onClick={agregarTicker}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: 'var(--v3-text)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '999px',
                  cursor: 'pointer'
                }}
              >
                Añadir
              </button>
            </div>
          )}
        </div>

        {noEncontrados.length > 0 && (
          <p style={{ color: '#b91c1c', fontSize: '12px', margin: '0 0 12px 0' }}>
            No se encontraron datos para: {noEncontrados.join(', ')}
          </p>
        )}

        {error && (
          <p style={{ color: '#b91c1c', fontSize: '12px', margin: '0 0 12px 0' }}>{error}</p>
        )}

        {cargando && (
          <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px' }}>Cargando…</p>
        )}

        {!cargando && empresas.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ marginBottom: '14px' }}>
              <div
                style={{
                  fontSize: '11.5px',
                  color: 'var(--v3-text-soft)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  marginBottom: '6px'
                }}
              >
                Precio actual
              </div>
              <div style={{ display: 'grid', gap: '4px' }}>
                {empresas.map((e) => (
                  <div
                    key={e.ticker}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13px'
                    }}
                  >
                    <span style={{ color: 'var(--v3-text-soft)' }}>
                      {e.ticker}
                      {e.sector && ` · ${e.sector}`}
                    </span>
                    <span style={{ fontWeight: 700 }}>{fmtPrecio(e.precio)}</span>
                  </div>
                ))}
              </div>
            </div>

            <BarraComparativa
              etiqueta="Variación 5 sesiones"
              min={-10}
              max={10}
              valores={empresas.map((e) => ({
                ticker: e.ticker,
                nombre: e.nombre,
                valor: e.variacion5
              }))}
            />

            <BarraComparativa
              etiqueta="Variación 60 sesiones"
              min={-15}
              max={15}
              valores={empresas.map((e) => ({
                ticker: e.ticker,
                nombre: e.nombre,
                valor: e.variacion60
              }))}
            />

            <BarraComparativa
              etiqueta="Sector 60 sesiones"
              min={-10}
              max={10}
              valores={empresas.map((e) => ({
                ticker: e.ticker,
                nombre: e.nombre,
                valor: e.variacionSector60
              }))}
            />

            <BarraComparativa
              etiqueta="Indicador Equaty"
              min={-100}
              max={100}
              valores={empresas.map((e) => ({
                ticker: e.ticker,
                nombre: e.nombre,
                valor: e.smiActual
              }))}
            />

            <BarraComparativa
              etiqueta="Percentil"
              min={0}
              max={100}
              valores={empresas.map((e) => ({
                ticker: e.ticker,
                nombre: e.nombre,
                valor: e.percentil
              }))}
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                marginTop: '8px',
                paddingTop: '12px',
                borderTop: '1px solid var(--v3-border)'
              }}
            >
              {empresas.map((e) => (
                <div key={e.ticker}>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--v3-text-mute)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px'
                    }}
                  >
                    {e.ticker}
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '2px' }}>
                    {e.zona ? situacionDesdeZona(e.zona) : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <p style={{ color: 'var(--v3-text-mute)', fontSize: '12px', marginTop: '8px' }}>
        El color indica signo o posición en el rango. No implica valoración. Datos históricos
        descriptivos. No predictivos. No constituyen recomendación de inversión.
      </p>
    </section>
  );
}
