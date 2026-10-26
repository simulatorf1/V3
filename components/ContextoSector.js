'use client';

import { useState } from 'react';
import Link from 'next/link';

function construirSlug(item) {
  const nombreLimpio = (item.nombre || item.ticker)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${item.ticker.toLowerCase()}__${nombreLimpio}`;
}

function pendienteDesdeCategoria(cat) {
  if (cat === 'A') return 'pendiente positiva';
  if (cat === 'C') return 'pendiente negativa';
  return 'sin pendiente';
}

function fmtPct(v, decimales = 2) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(decimales)}%`;
}

export default function ContextoSector({
  tickerActual,
  sector,
  ranking,
  cambiosZona,
  extremosAltos,
  extremosBajos
}) {
  const [tab, setTab] = useState('ranking');

  if (!sector) return null;

  const tabs = [
    { key: 'ranking', label: 'Ranking del sector' },
    { key: 'cambios', label: 'Cambios de pendiente' },
    { key: 'extremos', label: 'Extremos del sector' }
  ];

  const hayDatos =
    (ranking && ranking.length > 0) ||
    (cambiosZona && cambiosZona.length > 0) ||
    (extremosAltos && extremosAltos.length > 0) ||
    (extremosBajos && extremosBajos.length > 0);

  if (!hayDatos) {
    return (
      <section className="v3-seccion">
        <h2 className="v3-seccion-titulo">Contexto de sector · {sector}</h2>
        <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px' }}>
          No hay datos suficientes todavía para este sector.
        </p>
      </section>
    );
  }

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Contexto de sector · {sector}</h2>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '-4px' }}>
        Compara esta empresa con las demás del sector. Dato descriptivo.
      </p>

      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginTop: '10px',
          marginBottom: '12px',
          flexWrap: 'wrap'
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '5px 10px',
              fontSize: '11.5px',
              fontWeight: 600,
              borderRadius: '999px',
              border: tab === t.key ? '1px solid #2563eb' : '1px solid var(--v3-border)',
              background: tab === t.key ? '#2563eb' : '#fff',
              color: tab === t.key ? '#fff' : 'var(--v3-text)',
              cursor: 'pointer'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'ranking' && (
        <div>
          {!ranking || ranking.length === 0 ? (
            <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px' }}>
              Sin datos de ranking en este sector.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '4px' }}>
              {ranking.map((item, i) => {
                const esActual = item.ticker === tickerActual;
                return (
                  <li key={item.ticker}>
                    <Link
                      href={`/analisis/${construirSlug(item)}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 10px',
                        background: esActual ? '#eff6ff' : '#fff',
                        border: esActual ? '1px solid #2563eb' : '1px solid var(--v3-border)',
                        borderRadius: 'var(--v3-radius-sm)',
                        textDecoration: 'none',
                        color: 'var(--v3-text)',
                        fontSize: '12px'
                      }}
                    >
                      <span
                        style={{
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <strong>{i + 1}.</strong> {item.nombre}
                      </span>
                      <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {fmtPct(item.variacion60, 1)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {tab === 'cambios' && (
        <div>
          {!cambiosZona || cambiosZona.length === 0 ? (
            <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px' }}>
              Sin cambios de pendiente recientes en este sector.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '4px' }}>
              {cambiosZona.map((c) => (
                <li key={c.ticker}>
                  <Link
                    href={`/analisis/${construirSlug(c)}`}
                    style={{
                      display: 'block',
                      padding: '6px 10px',
                      border: '1px solid var(--v3-border)',
                      borderRadius: 'var(--v3-radius-sm)',
                      textDecoration: 'none',
                      color: 'var(--v3-text)',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{c.nombre}</div>
                    <div style={{ color: 'var(--v3-text-mute)', fontSize: '11px' }}>
                      Antes: {pendienteDesdeCategoria(c.categoriaAnterior)} · Ahora:{' '}
                      {pendienteDesdeCategoria(c.categoriaNueva)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'extremos' && (
        <div style={{ display: 'grid', gap: '10px' }}>
          {extremosAltos && extremosAltos.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--v3-text-mute)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  marginBottom: '4px'
                }}
              >
                Percentil ≥ 90
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '3px' }}>
                {extremosAltos.map((e) => (
                  <li key={e.ticker}>
                    <Link
                      href={`/analisis/${construirSlug(e)}`}
                      style={{ fontSize: '12px', color: 'var(--v3-text)', textDecoration: 'none' }}
                    >
                      {e.nombre} · {e.percentil}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {extremosBajos && extremosBajos.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--v3-text-mute)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  marginBottom: '4px'
                }}
              >
                Percentil ≤ 10
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '3px' }}>
                {extremosBajos.map((e) => (
                  <li key={e.ticker}>
                    <Link
                      href={`/analisis/${construirSlug(e)}`}
                      style={{ fontSize: '12px', color: 'var(--v3-text)', textDecoration: 'none' }}
                    >
                      {e.nombre} · {e.percentil}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(!extremosAltos || extremosAltos.length === 0) &&
            (!extremosBajos || extremosBajos.length === 0) && (
              <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px' }}>
                Sin extremos en este sector.
              </p>
            )}
        </div>
      )}

      <p style={{ color: 'var(--v3-text-mute)', fontSize: '11px', marginTop: '8px' }}>
        Datos históricos descriptivos. No implican valoración ni recomendación.
      </p>
    </section>
  );
}
