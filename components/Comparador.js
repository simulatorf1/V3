'use client';

import { useEffect, useRef, useState } from 'react';

function situacionDesdeZona(zona) {
  if (zona === 'alta') return 'parte alta';
  if (zona === 'baja') return 'parte baja';
  return 'parte intermedia';
}

function fmtPct(v, decimales = 2) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(decimales)}%`;
}

function fmtNum(v, decimales = 2) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return Number(v).toFixed(decimales);
}

function fmtPrecio(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return `${Number(v).toFixed(2)} €`;
}

function Tooltip({ texto }) {
  return (
    <span
      title={texto}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '14px',
        height: '14px',
        borderRadius: '50%',
        border: '1px solid var(--v3-text-mute)',
        color: 'var(--v3-text-mute)',
        fontSize: '10px',
        fontWeight: 700,
        cursor: 'help',
        flexShrink: 0,
        marginLeft: '6px'
      }}
    >
      ?
    </span>
  );
}

function BarraComparativa({ etiqueta, ayuda, valores, min, max, formato }) {
  const ceroPct = min < 0 && max > 0 ? ((0 - min) / (max - min)) * 100 : 0;

  return (
    <div style={{ marginBottom: '12px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '11.5px',
          color: 'var(--v3-text-soft)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
          marginBottom: '6px'
        }}
      >
        {etiqueta}
        {ayuda && <Tooltip texto={ayuda} />}
      </div>
      <div style={{ display: 'grid', gap: '5px' }}>
        {valores.map((v) => {
          const val = v.valor;
          const clamped =
            val === null || val === undefined ? null : Math.max(min, Math.min(max, val));
          let pct = 0;
          if (clamped !== null) {
            pct = ((clamped - min) / (max - min)) * 100;
          }
          const izquierda = Math.min(ceroPct, pct);
          const ancho = Math.abs(pct - ceroPct);
          const color = clamped === null ? '#e5e7eb' : clamped >= 0 ? '#2563eb' : '#9ca3af';

          return (
            <div key={v.ticker} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--v3-text-soft)',
                  width: '70px',
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
                  height: '12px',
                  background: 'var(--v3-bg-soft)',
                  border: '1px solid var(--v3-border)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  minWidth: 0
                }}
              >
                {ceroPct > 0 && ceroPct < 100 && (
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
                )}
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
                  width: '72px',
                  textAlign: 'right',
                  flexShrink: 0
                }}
              >
                {formato(val)}
              </div>
            </div>
          );
        })}
      </div>
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
    </div>
  );
}

export default function Comparador({ tickerActual, nombreActual }) {
  const [tickers, setTickers] = useState([tickerActual]);
  const [empresas, setEmpresas] = useState([]);
  const [noEncontrados, setNoEncontrados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const buscarRef = useRef(null);
  const debounceRef = useRef(null);

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
      .catch(() => setError('No se pudieron cargar los datos.'))
      .finally(() => setCargando(false));
  }, [tickers.join(',')]);

  useEffect(() => {
    function onClickFuera(e) {
      if (buscarRef.current && !buscarRef.current.contains(e.target)) {
        setMostrarResultados(false);
      }
    }
    document.addEventListener('mousedown', onClickFuera);
    return () => document.removeEventListener('mousedown', onClickFuera);
  }, []);

  function onBusquedaChange(e) {
    const valor = e.target.value;
    setBusqueda(valor);
    setMostrarResultados(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (valor.trim().length < 2) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/buscar?q=${encodeURIComponent(valor.trim())}`)
        .then((r) => r.json())
        .then((d) => {
          setResultados(d.resultados || []);
        })
        .catch(() => setResultados([]))
        .finally(() => setBuscando(false));
    }, 300);
  }

  function agregarEmpresa(emp) {
    if (!emp || !emp.ticker) return;
    if (tickers.includes(emp.ticker)) {
      setBusqueda('');
      setMostrarResultados(false);
      return;
    }
    if (tickers.length >= 3) {
      setBusqueda('');
      setMostrarResultados(false);
      return;
    }
    setTickers([...tickers, emp.ticker]);
    setBusqueda('');
    setResultados([]);
    setMostrarResultados(false);
  }

  function quitarTicker(t) {
    if (t === tickerActual) return;
    setTickers(tickers.filter((x) => x !== t));
  }

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Comparar con otras empresas</h2>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '-4px' }}>
        Añade hasta 2 empresas más para comparar sus datos con {nombreActual}. Dato descriptivo,
        no recomendación.
      </p>

      <div className="v3-card" style={{ padding: '16px', marginTop: '12px', overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '12px',
            alignItems: 'center'
          }}
        >
          {tickers.map((t) => {
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
            <div ref={buscarRef} style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
              <input
                type="text"
                value={busqueda}
                onChange={onBusquedaChange}
                onFocus={() => setMostrarResultados(true)}
                placeholder="Buscar empresa por nombre o ticker…"
                style={{
                  width: '100%',
                  padding: '6px 12px',
                  fontSize: '12px',
                  border: '1px solid var(--v3-border-strong)',
                  borderRadius: '999px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {mostrarResultados && (resultados.length > 0 || buscando) && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: '#fff',
                    border: '1px solid var(--v3-border-strong)',
                    borderRadius: 'var(--v3-radius-sm)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    zIndex: 20,
                    maxHeight: '240px',
                    overflowY: 'auto'
                  }}
                >
                  {buscando && (
                    <div
                      style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: 'var(--v3-text-soft)'
                      }}
                    >
                      Buscando…
                    </div>
                  )}
                  {!buscando &&
                    resultados.map((emp) => (
                      <button
                        key={emp.ticker}
                        onClick={() => agregarEmpresa(emp)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          background: '#fff',
                          border: 'none',
                          borderBottom: '1px solid var(--v3-border)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: 'var(--v3-text)'
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{emp.nombre}</div>
                        <div style={{ color: 'var(--v3-text-mute)', fontSize: '11px' }}>
                          {emp.ticker}
                          {emp.mercado && ` · ${emp.mercado}`}
                        </div>
                      </button>
                    ))}
                </div>
              )}
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
          <div>
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  fontSize: '11.5px',
                  color: 'var(--v3-text-soft)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  marginBottom: '4px'
                }}
              >
                Precio actual
              </div>
              {empresas.map((e) => (
                <div
                  key={e.ticker}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    padding: '2px 0'
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

            <BarraComparativa
              etiqueta="Variación 5 sesiones"
              ayuda="Diferencia porcentual entre el precio actual y el de hace 5 sesiones."
              min={-10}
              max={10}
              formato={(v) => fmtPct(v)}
              valores={empresas.map((e) => ({
                ticker: e.ticker,
                nombre: e.nombre,
                valor: e.variacion5
              }))}
            />

            <BarraComparativa
              etiqueta="Variación 60 sesiones"
              ayuda="Diferencia porcentual entre el precio actual y el de hace 60 sesiones."
              min={-15}
              max={15}
              formato={(v) => fmtPct(v)}
              valores={empresas.map((e) => ({
                ticker: e.ticker,
                nombre: e.nombre,
                valor: e.variacion60
              }))}
            />

            <BarraComparativa
              etiqueta="Sector 60 sesiones"
              ayuda="Variación porcentual de la media del sector en el mismo periodo."
              min={-10}
              max={10}
              formato={(v) => fmtPct(v)}
              valores={empresas.map((e) => ({
                ticker: e.ticker,
                nombre: e.nombre,
                valor: e.variacionSector60
              }))}
            />

            <BarraComparativa
              etiqueta="Indicador Equaty"
              ayuda="Oscilador que mide dónde se ha movido el precio dentro de su rango de 60 sesiones. Va de -100 a +100."
              min={-100}
              max={100}
              formato={(v) => fmtNum(v, 0)}
              valores={empresas.map((e) => ({
                ticker: e.ticker,
                nombre: e.nombre,
                valor: e.smiActual
              }))}
            />

            <BarraComparativa
              etiqueta="Percentil"
              ayuda="Posición del precio actual dentro del rango de las últimas 60 sesiones. 0 = mínimo, 100 = máximo."
              min={0}
              max={100}
              formato={(v) => (v === null || v === undefined ? '—' : v)}
              valores={empresas.map((e) => ({
                ticker: e.ticker,
                nombre: e.nombre,
                valor: e.percentil
              }))}
            />

            <BarraComparativa
              etiqueta="Posición en rango 60"
              ayuda="Punto del rango de las últimas 60 sesiones en el que está el precio actual. 0% = mínimo, 100% = máximo."
              min={0}
              max={100}
              formato={(v) => (v === null || v === undefined ? '—' : `${v.toFixed(0)}%`)}
              valores={empresas.map((e) => ({
                ticker: e.ticker,
                nombre: e.nombre,
                valor: e.posicionRango
              }))}
            />

            <BarraComparativa
              etiqueta="Amplitud del rango 60"
              ayuda="Cuánto ha oscilado el precio en las últimas 60 sesiones, entre su mínimo y su máximo."
              min={0}
              max={50}
              formato={(v) => fmtPct(v)}
              valores={empresas.map((e) => ({
                ticker: e.ticker,
                nombre: e.nombre,
                valor: e.amplitudRango
              }))}
            />

            <BarraComparativa
              etiqueta="Distancia al máximo 60"
              ayuda="Diferencia porcentual entre el precio actual y el máximo de las últimas 60 sesiones."
              min={-50}
              max={0}
              formato={(v) => fmtPct(v)}
              valores={empresas.map((e) => ({
                ticker: e.ticker,
                nombre: e.nombre,
                valor: e.distanciaMax
              }))}
            />

            <BarraComparativa
              etiqueta="Distancia al mínimo 60"
              ayuda="Diferencia porcentual entre el precio actual y el mínimo de las últimas 60 sesiones."
              min={0}
              max={50}
              formato={(v) => fmtPct(v)}
              valores={empresas.map((e) => ({
                ticker: e.ticker,
                nombre: e.nombre,
                valor: e.distanciaMin
              }))}
            />

            <BarraComparativa
              etiqueta="Volatilidad diaria media"
              ayuda="Desviación típica de los retornos diarios en las últimas 60 sesiones."
              min={0}
              max={5}
              formato={(v) => fmtPct(v)}
              valores={empresas.map((e) => ({
                ticker: e.ticker,
                nombre: e.nombre,
                valor: e.volatilidad
              }))}
            />

            <BarraComparativa
              etiqueta="Volatilidad semanal media"
              ayuda="Desviación típica de los retornos semanales en las últimas 104 semanas."
              min={0}
              max={15}
              formato={(v) => fmtPct(v)}
              valores={empresas.map((e) => ({
                ticker: e.ticker,
                nombre: e.nombre,
                valor: e.volatilidadSemanal
              }))}
            />

            <BarraComparativa
              etiqueta="Sesiones alcistas vs bajistas"
              ayuda="Porcentaje de sesiones en las que el precio cerró por encima del cierre anterior."
              min={0}
              max={100}
              formato={(v) => (v === null || v === undefined ? '—' : `${v.toFixed(0)}%`)}
              valores={empresas.map((e) => ({
                ticker: e.ticker,
                nombre: e.nombre,
                valor: e.ratioAlcistas
              }))}
            />

            <BarraComparativa
              etiqueta="Racha actual"
              ayuda="Número de sesiones consecutivas en las que el precio ha cerrado en la misma dirección."
              min={0}
              max={10}
              formato={(v) => (v === null || v === undefined ? '—' : `${v}`)}
              valores={empresas.map((e) => ({
                ticker: e.ticker,
                nombre: e.nombre,
                valor: e.racha
              }))}
            />

            <BarraComparativa
              etiqueta="Pendiente del indicador (5 sesiones)"
              ayuda="Indica si el valor del indicador Equaty ha subido o bajado en las últimas 5 sesiones, en porcentaje."
              min={-50}
              max={50}
              formato={(v) => fmtPct(v)}
              valores={empresas.map((e) => ({
                ticker: e.ticker,
                nombre: e.nombre,
                valor: e.pendienteIndicador
              }))}
            />

            <BarraComparativa
              etiqueta="Veces en la misma zona"
              ayuda="Número de sesiones de las últimas 60 en las que el indicador ha estado en la misma zona que ahora."
              min={0}
              max={60}
              formato={(v) => (v === null || v === undefined ? '—' : `${v}`)}
              valores={empresas.map((e) => ({
                ticker: e.ticker,
                nombre: e.nombre,
                valor: e.sesionesEnZona
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
                    {e.ticker} · situación
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
