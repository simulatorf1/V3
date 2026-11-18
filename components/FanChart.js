'use client';

import { useState } from 'react';

const W = 800;
const H = 380;
const PAD = { top: 40, right: 16, bottom: 70, left: 90 };
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

  // Línea negra = media aritmética por día (bandas[].media)
  const mediana = bandas.map((b) => ({
    x: toX(b.d),
    y: toY(b.media)
  }));

  const casoResaltado = hoverCaso !== null ? hoverCaso : casoActivo;
  const casoData = casoResaltado !== null ? trayectorias[casoResaltado] : null;

  return (
    <div style={{ maxWidth: `${W}px`, margin: '0 auto' }}>
      {intro && (
        <p style={{ fontSize: '13px', color: 'var(--v3-text-soft)', margin: '0 0 12px 0', lineHeight: 1.55 }}>
          {intro}
        </p>
      )}

      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <button
          onClick={() => setCasoActivo(null)}
          style={{
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '999px',
            border: `1px solid ${casoActivo === null ? '#1e40af' : 'var(--v3-border)'}`,
            background: casoActivo === null ? '#dbeafe' : '#fff',
            color: '#1e40af',
            cursor: 'pointer'
          }}
        >
          Media
        </button>
        {casos.map((c, i) => (
          <button
            key={i}
            onClick={() => setCasoActivo(i)}
            title={`${formatFecha(c.fecha)} · ${c.variacion >= 0 ? '+' : ''}${c.variacion.toFixed(2)}%`}
            style={{
              padding: '4px 9px',
              fontSize: '11.5px',
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
            <text x={PAD.left - 8} y={t.y + 5} fontSize="15" fill="#4b5563" textAnchor="end">
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
                strokeWidth={activa ? 3 : 1.4}
                opacity={tenue ? 0.2 : activa ? 1 : 0.75}
              />
            </g>
          );
        })}

        {/* Línea de la media: gruesa y negra */}
        <path d={pathLinea(mediana)} fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />

        <line x1={toX(0)} x2={toX(0)} y1={PAD.top} y2={PAD.top + ALTO} stroke="#6b7280" strokeWidth="1.5" strokeDasharray="4 4" />
        <text x={toX(0) + 5} y={PAD.top - 10} fontSize="13" fill="#6b7280" fontWeight="600">hoy</text>

        <circle cx={toX(0)} cy={toY(precioHoy)} r="5" fill="#000" />

        {bandas.map((b, i) => {
          const x = toX(b.d);
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={PAD.top + ALTO} y2={PAD.top + ALTO + 4} stroke="#d1d5db" />
              <text x={x} y={H - 32} fontSize="14" fill="#4b5563" textAnchor="middle">
                {formatFecha(b.fecha)}
              </text>
            </g>
          );
        })}

        {casoData && casoData.puntos.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#dc2626" />
            <text x={p.x} y={p.y - 10} fontSize="14" fill="#dc2626" textAnchor="middle" fontWeight="700">
              {p.valor.toFixed(2)}
            </text>
          </g>
        ))}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--v3-text-soft)', marginTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <span>
          Inicio: <strong style={{ color: 'var(--v3-text)' }}>{precioHoy?.toFixed(2)} €</strong>
          {casoData ? (
            <> · Caso del {formatFecha(casoData.fechaInicio)} · <strong style={{ color: casoData.variacion >= 0 ? '#166534' : '#991b1b' }}>{casoData.variacion >= 0 ? '+' : ''}{casoData.variacion.toFixed(2)}%</strong></>
          ) : (
            <> · media de {casos.length} casos</>
          )}
        </span>
        <span style={{ display: 'inline-flex', gap: '12px', alignItems: 'center' }}>
          <span><span style={{ display: 'inline-block', width: '18px', height: '2px', background: '#2563eb' }} /> casos</span>
          <span><span style={{ display: 'inline-block', width: '18px', height: '4px', background: '#000' }} /> media</span>
        </span>
      </div>
    </div>
  );
}
