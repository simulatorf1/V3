'use client';

import { useState } from 'react';

const W = 560;
const H = 260;
const PAD = { top: 16, right: 44, bottom: 34, left: 110 };
const ANCHO = W - PAD.left - PAD.right;
const ALTO = H - PAD.top - PAD.bottom;

const MIN = -20;
const MAX = 20;
const NUM_BINS = 10;
const ANCHO_BIN = (MAX - MIN) / NUM_BINS;

export default function HistogramaRetornos({ distribucion }) {
  const [hover, setHover] = useState(null);
  if (!distribucion || distribucion.length === 0) return null;

  const bins = Array.from({ length: NUM_BINS }, (_, i) => ({
    desde: MIN + i * ANCHO_BIN,
    hasta: MIN + (i + 1) * ANCHO_BIN,
    count: 0
  }));

  const totalOriginal = distribucion.reduce((acc, b) => acc + b.count, 0);
  for (const b of distribucion) {
    const centro = (b.desde + b.hasta) / 2;
    let idx = Math.floor((centro - MIN) / ANCHO_BIN);
    if (idx < 0) idx = 0;
    if (idx >= NUM_BINS) idx = NUM_BINS - 1;
    bins[idx].count += b.count;
  }

  const binsOrdenados = [...bins].reverse();
  const maxCount = Math.max(1, ...binsOrdenados.map((b) => b.count));
  const altoBarra = ALTO / binsOrdenados.length;
  const sep = Math.min(2, altoBarra * 0.15);
  const toX = (c) => PAD.left + (c / maxCount) * ANCHO;

  return (
    <div style={{ maxWidth: `${W}px`, margin: '0 auto', position: 'relative' }}>
      <p style={{ fontSize: '12px', color: 'var(--v3-text-soft)', margin: '0 0 10px 0', lineHeight: 1.55 }}>
        Distribución fija de los retornos obtenidos a 10 sesiones, agrupados en 10 tramos del 4%.
        Verde = ganancia, rojo = pérdida. Cada barra muestra cuántos casos cayeron en ese rango.
        No es una predicción: es la dispersión real de los resultados pasados.
      </p>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onMouseLeave={() => setHover(null)}
      >
        {[0, Math.round(maxCount / 2), maxCount].filter((v, i, a) => a.indexOf(v) === i).map((t, i) => (
          <g key={i}>
            <line x1={toX(t)} x2={toX(t)} y1={PAD.top} y2={PAD.top + ALTO} stroke="#f3f4f6" />
            <text x={toX(t)} y={H - 14} fontSize="10" fill="#6b7280" textAnchor="middle">{t}</text>
          </g>
        ))}

        {binsOrdenados.map((bin, i) => {
          const centro = (bin.desde + bin.hasta) / 2;
          const positivo = centro >= 0;
          const y = PAD.top + i * altoBarra + sep / 2;
          const h = altoBarra - sep;
          const w = toX(bin.count) - PAD.left;
          const color = positivo ? '#16a34a' : '#dc2626';
          const activo = hover === i;
          const op = bin.count === 0 ? 0.15 : activo ? 1 : 0.82;

          return (
            <g key={i} onMouseEnter={() => setHover(i)} style={{ cursor: 'pointer' }}>
              <rect x={PAD.left} y={y} width={Math.max(w, 0)} height={h} fill={color} opacity={op} rx="2" />
              <text x={PAD.left - 6} y={y + h / 2 + 4} fontSize="10.5" fill="#6b7280" textAnchor="end">
                {bin.desde >= 0 ? '+' : ''}{bin.desde.toFixed(0)}% a {bin.hasta >= 0 ? '+' : ''}{bin.hasta.toFixed(0)}%
              </text>
              {bin.count > 0 && (
                <text x={toX(bin.count) + 4} y={y + h / 2 + 4} fontSize="10.5" fill="#6b7280">
                  {bin.count}
                </text>
              )}
            </g>
          );
        })}

        <text x={PAD.left + ANCHO / 2} y={H - 2} fontSize="10" fill="#6b7280" textAnchor="middle">
          Número de casos
        </text>
      </svg>

      {hover !== null && (() => {
        const bin = binsOrdenados[hover];
        return (
          <div
            style={{
              position: 'absolute',
              top: '80px',
              right: '6px',
              background: 'rgba(17, 24, 39, 0.92)',
              color: '#fff',
              fontSize: '11.5px',
              padding: '6px 9px',
              borderRadius: '5px',
              pointerEvents: 'none',
              zIndex: 3,
              lineHeight: 1.5
            }}
          >
            <div style={{ fontWeight: 700 }}>
              {bin.desde >= 0 ? '+' : ''}{bin.desde.toFixed(0)}% a {bin.hasta >= 0 ? '+' : ''}{bin.hasta.toFixed(0)}%
            </div>
            <div>{bin.count} {bin.count === 1 ? 'caso' : 'casos'} ({totalOriginal > 0 ? Math.round((bin.count / totalOriginal) * 100) : 0}%)</div>
          </div>
        );
      })()}
    </div>
  );
}
