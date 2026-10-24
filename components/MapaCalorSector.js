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

function colorDesdePercentil(percentil) {
  if (percentil === null || percentil === undefined) return '#e5e7eb';
  if (percentil >= 90) return '#1e3a8a';
  if (percentil >= 70) return '#2563eb';
  if (percentil >= 50) return '#60a5fa';
  if (percentil >= 30) return '#bfdbfe';
  if (percentil >= 10) return '#e5e7eb';
  return '#9ca3af';
}

function colorTexto(percentil) {
  if (percentil === null || percentil === undefined) return 'var(--v3-text)';
  if (percentil >= 50) return '#fff';
  return 'var(--v3-text)';
}

export default function MapaCalorSector({ sectoresData, sectoresOrden }) {
  // sectoresOrden: array de nombres de sector ordenados por número de empresas
  // sectoresData: objeto { [sector]: [items] }
  const [sectorActivo, setSectorActivo] = useState(
    sectoresOrden && sectoresOrden.length > 0 ? sectoresOrden[0] : null
  );

  if (!sectoresOrden || sectoresOrden.length === 0) return null;
  if (!sectorActivo) return null;

  const items = sectoresData[sectorActivo] || [];

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Mapa de calor por sector</h2>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '-4px' }}>
        Elige un sector para ver la posición de sus empresas dentro de su rango de 60 sesiones.
        Azul oscuro = percentil más alto, gris = percentil más bajo. Dato descriptivo.
      </p>

      <div
        style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          marginTop: '12px',
          marginBottom: '12px'
        }}
      >
        {sectoresOrden.map((s) => {
          const activo = s === sectorActivo;
          return (
            <button
              key={s}
              onClick={() => setSectorActivo(s)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '999px',
                border: activo ? '1px solid #2563eb' : '1px solid var(--v3-border)',
                background: activo ? '#2563eb' : '#fff',
                color: activo ? '#fff' : 'var(--v3-text)',
                cursor: 'pointer'
              }}
            >
              {s}
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <p style={{ color: 'var(--v3-text-soft)' }}>
          No hay empresas con datos de percentil para este sector todavía.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: '8px'
          }}
        >
          {items.map((item) => (
            <Link
              key={item.ticker}
              href={`/analisis/${construirSlug(item)}`}
              style={{
                display: 'block',
                padding: '10px',
                borderRadius: 'var(--v3-radius-sm)',
                background: colorDesdePercentil(item.percentil),
                color: colorTexto(item.percentil),
                textDecoration: 'none',
                fontSize: '12px',
                minHeight: '60px'
              }}
            >
              <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{item.nombre}</div>
              <div style={{ opacity: 0.85, marginTop: '2px' }}>{item.ticker}</div>
              {item.percentil !== null && item.percentil !== undefined && (
                <div style={{ opacity: 0.9, marginTop: '2px', fontSize: '11px' }}>
                  P{item.percentil}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      <p style={{ color: 'var(--v3-text-mute)', fontSize: '12px', marginTop: '8px' }}>
        El color indica posición en el rango, no valoración.
      </p>
    </section>
  );
}
