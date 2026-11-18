'use client';

import { useState } from 'react';

const W = 560;
const H = 260;
const PAD = { top: 30, right: 12, bottom: 50, left: 64 };
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
  return puntos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

export default function FanChart({ bandas, casos, precioHoy, fechaHoy, horizonte = 'sesiones', intro }) {
  const [casoActivo, setCasoActivo] = useState(null);
  const [hoverCaso, setHoverCaso] = useState(null);

  if (!bandas || bandas.length < 2 || !casos || casos.length === 0) return null;

  const todosPrecios = [precioHoy];
  for (const c of casos) for (const p of c.precios) todosPrecios.push(p.valor);
  const yMin = Math.min(...todosPrecios);
  const yMax = Math.max(...todosPrecios);
  const margen = (yMax - yMin) * 0.08 || 1;
  const y0 = yMin - margen;
  const y1 = yMax + margen;

  const toX = (d) => PAD.left + (d / (bandas.length - 1)) * ANCHO;
  const toY = (v) => PAD.top + ALTO - ((v - y0) / (y1 - y0)) * ALTO;

  const ticksY = [];
  for (let i = 0; i <= 4; i++) {
    const v = y0 + ((y1 - y0) / 4) * i;
    ticksY.push({ v, y: toY(v) });
  }

  const trayectorias = casos.map((c, idx) => ({
    idx,
    fechaInicio: c.fecha,
    variacion: c.variacion,
    puntos: c.precios.map((p) => ({
      x: toX(p.d),
      y: toY(p.valor),
      d: p.d,
      valor: p.valor,
      fecha: p.fecha
    }))
  }));

  const mediana = bandas.map((b, i) => ({
    x: toX(b.d),
    y: toY(i === 0 ? precioHoy : b.p50)
  }));

  const casoResaltado = hoverCaso !== null ? hoverCaso : casoActivo;
  const casoData = casoResaltado !== null ? trayectorias[casoResaltado] : null;

  return (
    <div style={{ maxWidth: `${W}px`, margin: '0 auto' }}>
      {intro && (
        <p style={{ fontSize: '12px', color: 'var(--v3-text-soft)', margin: '0 0 10px 0', lineHeight: 1.55 }}>
          {intro}
        </p>
      )}

      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
        <button
          onClick={() => setCasoActivo(null)}
          style={{
            padding: '3px 8px',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: '999px',
            border: `1px solid ${casoActivo === null ? '#1e40af' : 'var(--v3-border)'}`,
            background: casoActivo === null ? '#dbeafe' : '#fff',
            color: '#1e40af',
            cursor: 'pointer'
          }}
        >
          Mediana
        </button>
        {casos.map((c, i) => (
          <button
            key={i}
            onClick={() => setCasoActivo(i)}
            title={`${formatFecha(c.fecha)} · ${c.variacion >= 0 ? '+' : ''}${c.variacion.toFixed(2)}%`}
            style={{
              padding: '3px 7px',
              fontSize: '10.5px',
              fontWeight: 600,
              borderRadius: '999px',
              border: `1px solid ${casoActivo === i ? '#1e40af' : 'var(--v3-border)'}`,
              background: casoActivo === i ? '#dbeafe' : '#fff',
              color: casoActivo === i ? '#1e40af' : 'var(--v3-text)',
              cursor: 'pointer'
            }}
          >
            {formatFecha(c.fecha)}
          </button>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} onMouseLeave={() => setHoverCaso(null)}>
        {ticksY.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={PAD.left + ANCHO} y1={t.y} y2={t.y} stroke="#f3f4f6" />
            <text x={PAD.left - 6} y={t.y + 4} fontSize="11" fill="#6b7280" textAnchor="end">
              {t.v.toFixed(2)} €
            </text>
          </g>
        ))}

        {trayectorias.map((t) => {
          const activa = casoResaltado === t.idx;
          const tenue = casoResaltado !== null && !activa;
          return (
            <g key={t.idx} onMouseEnter={() => setHoverCaso(t.idx)} style={{ cursor: 'pointer' }}>
              <path
                d={pathLinea(t.puntos)}
                fill="none"
                stroke={activa ? '#dc2626' : '#2563eb'}
                strokeWidth={activa ? 2.2 : 1}
                opacity={tenue ? 0.2 : activa ? 1 : 0.75}
              />
            </g>
          );
        })}

        <path d={pathLinea(mediana)} fill="none" stroke="#111827" strokeWidth="3" strokeLinecap="round" />

        <line x1={toX(0)} x2={toX(0)} y1={PAD.top} y2={PAD.top + ALTO} stroke="#6b7280" strokeWidth="1" strokeDasharray="3 3" />
        <text x={toX(0) + 3} y={PAD.top - 6} fontSize="10" fill="#6b7280">hoy</text>

        <circle cx={toX(0)} cy={toY(precioHoy)} r="3.5" fill="#111827" />

        {bandas.map((b, i) => {
          const x = toX(b.d);
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={PAD.top + ALTO} y2={PAD.top + ALTO + 3} stroke="#d1d5db" />
              <text x={x} y={H - 24} fontSize="10" fill="#6b7280" textAnchor="middle">
                {formatFecha(b.fecha)}
              </text>
            </g>
          );
        })}

        {casoData && casoData.puntos.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="2.5" fill="#dc2626" />
            <text x={p.x} y={p.y - 7} fontSize="10" fill="#dc2626" textAnchor="middle" fontWeight="700">
              {p.valor.toFixed(2)}
            </text>
          </g>
        ))}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--v3-text-soft)', marginTop: '6px', flexWrap: 'wrap', gap: '6px' }}>
        <span>
          Inicio: <strong style={{ color: 'var(--v3-text)' }}>{precioHoy?.toFixed(2)} €</strong>
          {casoData ? (
            <> · Caso del {formatFecha(casoData.fechaInicio)} · <strong style={{ color: casoData.variacion >= 0 ? '#166534' : '#991b1b' }}>{casoData.variacion >= 0 ? '+' : ''}{casoData.variacion.toFixed(2)}%</strong></>
          ) : (
            <> · mediana de {casos.length} casos</>
          )}
        </span>
        <span style={{ display: 'inline-flex', gap: '10px', alignItems: 'center' }}>
          <span><span style={{ display: 'inline-block', width: '14px', height: '1.5px', background: '#2563eb' }} /> casos</span>
          <span><span style={{ display: 'inline-block', width: '14px', height: '3px', background: '#111827' }} /> mediana</span>
        </span>
      </div>
    </div>
  );
}
