'use client';

import { useState } from 'react';

const W = 560;
const H = 180;
const PAD = { top: 14, right: 40, bottom: 28, left: 96 };
const ANCHO = W - PAD.left - PAD.right;
const ALTO = H - PAD.top - PAD.bottom;

export default function HistogramaRetornos({ distribucion, horizonte = '10 sesiones' }) {
  const [hover, setHover] = useState(null);

  if (!distribucion || distribucion.length === 0) return null;

  // Ordenar de mayor a menor retorno (arriba positivos, abajo negativos)
  const bins = [...distribucion].sort((a, b) => b.desde - a.desde);

  const maxCount = Math.max(...bins.map((b) => b.count));
  if (maxCount === 0) return null;

  const altoBarra = ALTO / bins.length;
  const separacion = Math.min(2, altoBarra * 0.15);
  const toX = (count) => PAD.left + (count / maxCount) * ANCHO;

  // Ticks X (conteo)
  const ticksX = [0, Math.round(maxCount / 2), maxCount].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div style={{ maxWidth: `${W}px`, margin: '0 auto', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="Distribución horizontal de retornos históricos"
        onMouseLeave={() => setHover(null)}
      >
        {/* Rejilla vertical */}
        {ticksX.map((t, i) => {
          const x = toX(t);
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={PAD.top} y2={PAD.top + ALTO} stroke="#f3f4f6" strokeWidth="1" />
              <text x={x} y={H - 12} fontSize="9" fill="#9ca3af" textAnchor="middle">{t}</text>
            </g>
          );
        })}

        {/* Barras horizontales */}
        {bins.map((bin, i) => {
          const centro = (bin.desde + bin.hasta) / 2;
          const esPositivo = centro >= 0;
          const y = PAD.top + i * altoBarra + separacion / 2;
          const h = altoBarra - separacion;
          const w = toX(bin.count) - PAD.left;
          const color = esPositivo ? '#16a34a' : '#dc2626';
          const activo = hover === i;
          const opacity = bin.count === 0 ? 0.12 : activo ? 1 : 0.75;

          return (
            <g
              key={i}
              onMouseEnter={() => setHover(i)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={PAD.left}
                y={y}
                width={Math.max(w, 0)}
                height={h}
                fill={color}
                opacity={opacity}
                rx="2"
              />
              {/* Etiqueta de rango a la izquierda */}
              <text
                x={PAD.left - 6}
                y={y + h / 2 + 3}
                fontSize="8.5"
                fill="#6b7280"
                textAnchor="end"
              >
                {bin.desde.toFixed(1)}% a {bin.hasta.toFixed(1)}%
              </text>
              {/* Conteo dentro/fuera de la barra */}
              {bin.count > 0 && (
                <text
                  x={toX(bin.count) + 4}
                  y={y + h / 2 + 3}
                  fontSize="8.5"
                  fill="#6b7280"
                >
                  {bin.count}
                </text>
              )}
            </g>
          );
        })}

        {/* Etiqueta eje X */}
        <text
          x={PAD.left + ANCHO / 2}
          y={H - 2}
          fontSize="9"
          fill="#9ca3af"
          textAnchor="middle"
        >
          Número de casos
        </text>
      </svg>

      {/* Tooltip */}
      {hover !== null && (() => {
        const bin = bins[hover];
        return (
          <div
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              background: 'rgba(17, 24, 39, 0.92)',
              color: '#fff',
              fontSize: '10.5px',
              padding: '6px 9px',
              borderRadius: '5px',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 3,
              lineHeight: 1.5
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>
              {bin.desde.toFixed(1)}% a {bin.hasta.toFixed(1)}%
            </div>
            <div>{bin.count} {bin.count === 1 ? 'caso' : 'casos'}</div>
          </div>
        );
      })()}

      <p style={{ fontSize: '10px', color: 'var(--v3-text-mute)', margin: '4px 0 0 0', lineHeight: 1.45, textAlign: 'center' }}>
        Distribución de retornos a {horizonte}. Verde = subidas, rojo = bajadas.
      </p>
    </div>
  );
}
