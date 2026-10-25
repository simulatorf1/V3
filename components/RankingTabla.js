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

function situacionDesdeZona(zona) {
  if (zona === 'alta') return 'parte alta';
  if (zona === 'baja') return 'parte baja';
  return 'parte intermedia';
}

function fmtPct(v, decimales = 2) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(decimales)}%`;
}

function textoSubtitulo(tipo) {
  if (tipo === 'variacion5') return 'Ordenado de mayor a menor variación en 5 sesiones.';
  if (tipo === 'variacion60') return 'Ordenado de mayor a menor variación en 60 sesiones.';
  if (tipo === 'percentil') return 'Ordenado de mayor a menor percentil.';
  return 'Ordenado de mayor a menor variación.';
}

export default function RankingTabla({
  items,
  titulo,
  total,
  colapsable = true,
  tipo,
  mostrarPercentil = true,
  verTodasHref = null
}) {
  const [expandido, setExpandido] = useState(!colapsable);

  if (!items || items.length === 0) {
    return (
      <section className="v3-seccion">
        <h2 className="v3-seccion-titulo">{titulo || 'Ranking'}</h2>
        <p style={{ color: 'var(--v3-text-soft)' }}>
          Sin datos disponibles todavía. Vuelve en unos minutos.
        </p>
      </section>
    );
  }

  const itemsVisibles = expandido ? items : items.slice(0, 3);
  const hayMas = items.length > 3;
  const hayBotones = (colapsable && hayMas) || verTodasHref;

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">{titulo || 'Ranking'}</h2>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '-4px' }}>
        {textoSubtitulo(tipo)}
        {total !== undefined && total !== null && (
          <span>
            {' '}
            Mostrando {itemsVisibles.length} de {total} empresas con datos disponibles.
          </span>
        )}
      </p>

      <div
        style={{
          border: '1px solid var(--v3-border)',
          borderRadius: 'var(--v3-radius-sm)',
          overflowX: 'auto',
          overflowY: 'hidden',
          marginTop: '12px',
          width: '100%',
          maxWidth: '100%',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <table className="v3-table" style={{ margin: 0, minWidth: '560px' }}>
          <thead
            style={{
              background: 'var(--v3-bg-soft)',
              position: 'sticky',
              top: 0,
              zIndex: 1
            }}
          >
            <tr>
              <th>#</th>
              <th>Empresa</th>
              <th>Precio</th>
              <th>Var. 5 ses.</th>
              <th>Var. 60 ses.</th>
              <th>Situación</th>
              {mostrarPercentil && <th>Percentil</th>}
            </tr>
          </thead>
          <tbody>
            {itemsVisibles.map((item, i) => (
              <tr key={item.ticker}>
                <td style={{ color: 'var(--v3-text-mute)' }}>{i + 1}</td>
                <td>
                  <Link
                    href={`/analisis/${construirSlug(item)}`}
                    style={{ color: 'var(--v3-text)', fontWeight: 600 }}
                  >
                    {item.nombre}
                  </Link>
                  <div style={{ color: 'var(--v3-text-mute)', fontSize: '11px' }}>
                    {item.ticker}
                    {item.sector && ` · ${item.sector}`}
                  </div>
                </td>
                <td>
                  {item.precio !== null && item.precio !== undefined
                    ? `${Number(item.precio).toFixed(2)} €`
                    : '—'}
                </td>
                <td>{fmtPct(item.variacion5)}</td>
                <td>{fmtPct(item.variacion60)}</td>
                <td>{item.zona ? situacionDesdeZona(item.zona) : '—'}</td>
                {mostrarPercentil && (
                  <td>
                    {item.percentil !== null && item.percentil !== undefined
                      ? item.percentil
                      : '—'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hayBotones && (
        <div
          style={{
            marginTop: '12px',
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          {colapsable && hayMas && (
            <button
              onClick={() => setExpandido(!expandido)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: 'var(--v3-radius-sm)',
                border: '1px solid var(--v3-border-strong)',
                background: '#fff',
                color: 'var(--v3-text)',
                cursor: 'pointer'
              }}
            >
              {expandido ? 'Ver solo los 3 primeros' : `Ver los ${items.length} primeros`}
            </button>
          )}
          {verTodasHref && (
            <Link
              href={verTodasHref}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: 'var(--v3-radius-sm)',
                border: '1px solid #2563eb',
                background: '#2563eb',
                color: '#fff',
                textDecoration: 'none'
              }}
            >
              Ver todas las empresas ({total || items.length})
            </Link>
          )}
        </div>
      )}

      <p style={{ color: 'var(--v3-text-mute)', fontSize: '12px', marginTop: '8px' }}>
        El color y las cifras indican hechos históricos. No implican valoración ni acción.
      </p>
    </section>
  );
}
