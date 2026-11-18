'use client';

import { useState } from 'react';

const W = 560;
const H = 240;
const PAD = { top: 28, right: 12, bottom: 34, left: 52 };
const ANCHO = W - PAD.left - PAD.right;
const ALTO = H - PAD.top - PAD.bottom;

function formatFecha(fechaISO) {
  if (!fechaISO) return '';
  try {
    const d = new Date(fechaISO + 'T00:00:00');
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d.getDate()} ${meses[d.getMonth()]}`;
  } catch (e) {
    return '';
  }
}

function pathLinea(puntos) {
  return puntos
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
}

function pathArea(sup, inf) {
  const s = sup.map((p) => `${p.x},${p.y}`);
  const i = [...inf].reverse().map((p) => `${p.x},${p.y}`);
  return `M ${s.join(' L ')} L ${i.join(' L ')} Z`;
}

export default function FanChart({ bandas, casos, precioHoy, fechaHoy, horizonte = 'sesiones' }) {
  const [hoverCaso, setHoverCaso] = useState(null);
  const [hoverDia, setHoverDia] = useState(null);

  if (!bandas || bandas.length < 2 || !casos || casos.length === 0) return null;

  // Rango Y: incluye bandas y todas las trayectorias
  const todosPrecios = [];
  for (const b of bandas) todosPrecios.push(b.p10, b.p90);
  for (const c of casos) {
    for (const p of c.precios) todosPrecios.push(p.valor);
  }
  todosPrecios.push(precioHoy);

  const yMin = Math.min(...todosPrecios);
  const yMax = Math.max(...todosPrecios);
  const margen = (yMax - yMin) * 0.08 || 1;
  const y0 = yMin - margen;
  const y1 = yMax + margen;

  const toX = (d) => PAD.left + (d / (bandas.length - 1)) * ANCHO;
  const toY = (v) => PAD.top + ALTO - ((v - y0) / (y1 - y0)) * ALTO;

  // Ticks Y (5)
  const ticksY = [];
  for (let i = 0; i <= 4; i++) {
    const v = y0 + ((y1 - y0) / 4) * i;
    ticksY.push({ v, y: toY(v) });
  }

  // Ticks X (fechas cada 2 días para no saturar)
  const ticksX = bandas.filter((b) => b.d % 2 === 0 || b.d === bandas.length - 1);

  // Trayectorias individuales
  const trayectorias = casos.map((c, idx) => {
    const puntos = c.precios.map((p) => ({
      x: toX(p.d),
      y: toY(p.valor),
      d: p.d,
      valor: p.valor,
      fecha: p.fecha
    }));
    return { idx, puntos, fechaInicio: c.fecha, variacion: c.variacion };
  });

  const bandaSup80 = bandas.map((b) => ({ x: toX(b.d), y: toY(b.p90) }));
  const bandaInf80 = bandas.map((b) => ({ x: toX(b.d), y: toY(b.p10) }));
  const bandaSup50 = bandas.map((b) => ({ x: toX(b.d), y: toY(b.p75) }));
  const bandaInf50 = bandas.map((b) => ({ x: toX(b.d), y: toY(b.p25) }));
  const mediana = bandas.map((b) => ({ x: toX(b.d), y: toY(b.p50) }));

  const diaHover = hoverDia !== null ? bandas.find((b) => b.d === hoverDia) : null;

  return (
    <div style={{ maxWidth: `${W}px`, margin: '0 auto', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="Cono de probabilidad histórica"
        onMouseLeave={() => { setHoverCaso(null); setHoverDia(null); }}
      >
        {/* Rejilla Y + etiquetas precio */}
        {ticksY.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={PAD.left + ANCHO} y1={t.y} y2={t.y} stroke="#f3f4f6" strokeWidth="1" />
            <text x={PAD.left - 6} y={t.y + 3} fontSize="9" fill="#9ca3af" textAnchor="end">
              {t.v.toFixed(2)} €
            </text>
          </g>
        ))}

        {/* Bandas */}
        <path d={pathArea(bandaSup80, bandaInf80)} fill="rgba(37, 99, 235, 0.10)" />
        <path d={pathArea(bandaSup50, bandaInf50)} fill="rgba(37, 99, 235, 0.22)" />

        {/* Trayectorias individuales */}
        {trayectorias.map((t) => {
          const activa = hoverCaso === t.idx;
          return (
            <path
              key={t.idx}
              d={pathLinea(t.puntos)}
              fill="none"
              stroke={activa ? '#2563eb' : '#cbd5e1'}
              strokeWidth={activa ? 1.8 : 0.6}
              opacity={hoverCaso === null ? 0.55 : activa ? 1 : 0.15}
              style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
              onMouseEnter={() => setHoverCaso(t.idx)}
            />
          );
        })}

        {/* Mediana */}
        <path d={pathLinea(mediana)} fill="none" stroke="#1e40af" strokeWidth="1.6" strokeLinecap="round" />

        {/* Línea vertical "hoy" */}
        <line x1={toX(0)} x2={toX(0)} y1={PAD.top} y2={PAD.top + ALTO} stroke="#6b7280" strokeWidth="1" strokeDasharray="3 3" />
        <text x={toX(0) + 3} y={PAD.top - 6} fontSize="8.5" fill="#6b7280">hoy</text>

        {/* Punto de partida (precioHoy) */}
        <circle cx={toX(0)} cy={toY(precioHoy)} r="3" fill="#1e40af" />

        {/* Eje X: fechas */}
        {ticksX.map((b, i) => {
          const x = toX(b.d);
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={PAD.top + ALTO} y2={PAD.top + ALTO + 3} stroke="#d1d5db" strokeWidth="1" />
              <text x={x} y={H - 18} fontSize="8.5" fill="#9ca3af" textAnchor="middle">
                {formatFecha(b.fecha)}
              </text>
            </g>
          );
        })}

        {/* Zonas hover por día (para tooltip del día) */}
        {bandas.map((b) => {
          const x = toX(b.d);
          const w = ANCHO / (bandas.length - 1);
          return (
            <rect
              key={b.d}
              x={x - w / 2}
              y={PAD.top}
              width={w}
              height={ALTO}
              fill="transparent"
              onMouseEnter={() => setHoverDia(b.d)}
            />
          );
        })}
      </svg>

      {/* Tooltip del día */}
      {diaHover && (
        <div
          style={{
            position: 'absolute',
            top: '30px',
            left: `calc(${(toX(diaHover.d) / W) * 100}% + 8px)`,
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
          <div style={{ fontWeight: 700, marginBottom: '2px' }}>{formatFecha(diaHover.fecha)}</div>
          <div>Mediana: {diaHover.p50.toFixed(2)} €</div>
          <div>50%: {diaHover.p25.toFixed(2)} – {diaHover.p75.toFixed(2)} €</div>
          <div>80%: {diaHover.p10.toFixed(2)} – {diaHover.p90.toFixed(2)} €</div>
        </div>
      )}

      {/* Tooltip de trayectoria individual */}
      {hoverCaso !== null && !diaHover && (() => {
        const t = trayectorias[hoverCaso];
        return (
          <div
            style={{
              position: 'absolute',
              top: '30px',
              left: '8px',
              background: 'rgba(37, 99, 235, 0.95)',
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
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>Caso {formatFecha(t.fechaInicio)}</div>
            <div>Retorno: {t.variacion >= 0 ? '+' : ''}{t.variacion.toFixed(2)}%</div>
          </div>
        );
      })()}

      {/* Pie */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '10px',
          color: 'var(--v3-text-mute)',
          marginTop: '4px',
          flexWrap: 'wrap',
          gap: '6px'
        }}
      >
        <span>
          Precio actual: <strong style={{ color: 'var(--v3-text)' }}>{precioHoy?.toFixed(2)} €</strong>
          {' · '}{casos.length} casos similares
        </span>
        <span style={{ display: 'inline-flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '8px', background: 'rgba(37, 99, 235, 0.22)', borderRadius: '2px' }} />
            50%
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '8px', background: 'rgba(37, 99, 235, 0.10)', borderRadius: '2px' }} />
            80%
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '1.6px', background: '#1e40af' }} />
            Mediana
          </span>
        </span>
      </div>

      <p style={{ fontSize: '10px', color: 'var(--v3-text-mute)', margin: '4px 0 0 0', lineHeight: 1.45, textAlign: 'center' }}>
        Cada línea gris es un caso histórico. Pasa el cursor para resaltarlo. No es una predicción.
      </p>
    </div>
  );
}
