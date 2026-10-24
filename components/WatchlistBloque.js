'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWatchlist } from './WatchlistContext';

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

export default function WatchlistBloque({ empresas }) {
  const { lista, listo } = useWatchlist();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!listo) return;
    if (!empresas || empresas.length === 0) {
      setItems([]);
      return;
    }
    const filtrados = empresas.filter((e) => lista.includes(e.ticker));
    setItems(filtrados);
  }, [lista, empresas, listo]);

  if (!listo) return null;

  if (!lista || lista.length === 0) {
    return (
      <section className="v3-seccion">
        <h2 className="v3-seccion-titulo">Mi lista</h2>
        <p style={{ color: 'var(--v3-text-soft)', fontSize: '14px' }}>
          Aún no has añadido empresas. Entra en la ficha de cualquier empresa y pulsa "Añadir a mi
          lista" para verlas aquí cuando vuelvas.
        </p>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="v3-seccion">
        <h2 className="v3-seccion-titulo">Mi lista</h2>
        <p style={{ color: 'var(--v3-text-soft)', fontSize: '14px' }}>
          Tienes {lista.length} empresa{lista.length === 1 ? '' : 's'} en tu lista, pero todavía
          no hay datos disponibles. Abre sus fichas para actualizarlas.
        </p>
      </section>
    );
  }

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Mi lista</h2>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '-4px' }}>
        Empresas que has marcado. Se guardan solo en este navegador.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '10px',
          marginTop: '12px',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0
        }}
      >
        {items.map((item) => (
          <Link
            key={item.ticker}
            href={`/analisis/${construirSlug(item)}`}
            style={{
              display: 'block',
              padding: '12px 14px',
              background: '#fff',
              border: '1px solid var(--v3-border)',
              borderRadius: 'var(--v3-radius-sm)',
              textDecoration: 'none',
              color: 'var(--v3-text)',
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: '14px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {item.nombre}
            </div>
            <div style={{ color: 'var(--v3-text-soft)', fontSize: '11px', marginTop: '2px' }}>
              {item.ticker}
              {item.sector && ` · ${item.sector}`}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginTop: '8px'
              }}
            >
              <span style={{ fontSize: '16px', fontWeight: 700 }}>
                {item.precio !== null && item.precio !== undefined
                  ? `${Number(item.precio).toFixed(2)} €`
                  : '—'}
              </span>
              {item.zona && (
                <span style={{ fontSize: '11px', color: 'var(--v3-text-soft)' }}>
                  {situacionDesdeZona(item.zona)}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
