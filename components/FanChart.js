'use client';

import { useState } from 'react';

const W = 560;
const H = 260;
const PAD = { top: 40, right: 12, bottom: 46, left: 56 };
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

function pathArea(sup, inf) {
  const s = sup.map((p) => `${p.x},${p.y}`);
  const i = [...inf].reverse().map((p) => `${p.x},${p.y}`);
  return `M ${s.join(' L ')} L ${i.join(' L ')} Z`;
}

export default function FanChart({ bandas, casos, precioHoy, fechaHoy, horizonte = 'sesiones' }) {
  const [casoActivo, setCasoActivo] = useState(null); // null = caso medio
  const [hoverCaso, setHoverCaso] = useState(null);

  if (!bandas || bandas.length < 2 || !casos || casos.length === 0) return null;

  // Y rango
  const todosPrecios = [precioHoy];
  for (const b of bandas) todosPrecios.push(b.p10, b.p90);
  for (const c of casos) for (const p of c.precios) todosPrecios.push(p.valor);
  const yMin = Math.min(...todosPrecios);
  const yMax = Math.max(...todosPrecios);
  const margen = (yMax - yMin) * 0.08 || 1;
  const y0 = yMin - margen;
  const y1 = yMax + margen;

  const toX = (d) => PAD.left + (d / (bandas.length - 1)) * ANCHO;
  const toY = (v) => PAD.top + ALTO - ((v - y0) / (y1 - y0)) * ALTO;

  // Ticks Y
  const ticksY = [];
  for (let i = 0; i <= 4; i++) {
    const v = y0 + ((y1 - y0) / 4) * i;
    ticksY.push({ v, y: toY(v) });
  }

  // Todas las trayectorias (con día 0 = precioHoy)
  const trayectorias = casos.map((c, idx) => {
    const puntos = [
      { d: 0, valor: precioHoy, fecha: fechaHoy },
      ...c.precios.slice(1).map((p) => ({ d: p.d, valor: p.valor, fecha: p.fecha }))
    ];
    return {
      idx,
      fechaInicio: c.fecha,
      variacion: c.variacion,
      puntos: puntos.map((p) => ({ x: toX(p.d), y: toY(p.valor), d: p.d, valor: p.valor, fecha: p.fecha }))
    };
  });

  const bandaSup80 = bandas.map((b) => ({ x: toX(b.d), y: toY(b.p90) }));
  const bandaInf80 = bandas.map((b) => ({ x: toX(b.d), y: toY(b.p10) }));
  const bandaSup50 = bandas.map((b) => ({ x: toX(b.d), y: toY(b.p75) }));
  const bandaInf50 = bandas.map((b) => ({ x: toX(b.d), y: toY(b.p25) }));
  const mediana = bandas.map((b) => ({ x: toX(b.d), y: toY(b.p50) }));

  const casoResaltado = hoverCaso !== null ? hoverCaso : casoActivo;
  const casoData = casoResaltado !== null ? trayectorias[casoResaltado] : null;

  return (
    <div style={{ maxWidth: `${W}px`, margin: '0 auto' }}>
      {/* Botones de selección de caso */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          flexWrap: 'wrap',
          marginBottom: '8px',
          justifyContent: 'center'
        }}
      >
        <button
          onClick={() => setCasoActivo(null)}
          style={{
            padding: '3px 8px',
            fontSize: '10.5px',
            fontWeight: 600,
            borderRadius: '999px',
            border: `1px solid ${casoActivo === null ? '#1e40af' : 'var(--v3-border)'}`,
            background: casoActivo === null ? '#dbeafe' : '#fff',
            color: '#1e40af',
            cursor: 'pointer'
          }}
        >
          Caso medio
        </button>
        {casos.map((c, i) => (
          <button
            key={i}
            onClick={() => setCasoActivo(i)}
            title={`${formatFecha(c.fecha)} · ${c.variacion >= 0 ? '+' : ''}${c.variacion.toFixed(2)}%`}
            style={{
              padding: '3px 8px',
              fontSize: '10.5px',
              fontWeight: 600,
              borderRadius: '999px',
              border: `1px solid ${casoActivo === i ? '#1e40af' : 'var(--v3-border)'}`,
              background: casoActivo === i ? '#dbeafe' : '#fff',
              color: casoActivo === i ? '#1e40af' : 'var(--v3-text)',
              cursor: 'pointer'
            }}
          >
            Caso {i + 1}
          </button>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onMouseLeave={() => setHoverCaso(null)}
      >
        {/* Rejilla + etiquetas Y */}
        {ticksY.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={PAD.left + ANCHO} y1={t.y} y2={t.y} stroke="#f3f4f6" strokeWidth="1" />
            <text x={PAD.left - 6} y={t.y + 3} fontSize="9" fill="#9ca3af" textAnchor="end">
              {t.v.toFixed(2)} €
            </text>
          </g>
        ))}

        {/* Bandas (solo si caso medio activo o nada) */}
        {casoResaltado === null && (
          <>
            <path d={pathArea(bandaSup80, bandaInf80)} fill="rgba(37, 99, 235, 0.10)" />
            <path d={pathArea(bandaSup50, bandaInf50)} fill="rgba(37, 99, 235, 0.22)" />
          </>
        )}

        {/* Trayectorias */}
        {trayectorias.map((t) => {
          const activa = casoResaltado === t.idx;
          const tenue = casoResaltado !== null && !activa;
          return (
            <path
              key={t.idx}
              d={pathLinea(t.puntos)}
              fill="none"
              stroke={activa ? '#1e40af' : '#cbd5e1'}
              strokeWidth={activa ? 2 : 0.6}
              opacity={tenue ? 0.15 : activa ? 1 : 0.55}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoverCaso(t.idx)}
            />
          );
        })}

        {/* Mediana (si caso medio) */}
        {casoResaltado === null && (
          <path d={pathLinea(mediana)} fill="none" stroke="#1e40af" strokeWidth="1.6" strokeLinecap="round" />
        )}

        {/* Línea vertical hoy */}
        <line x1={toX(0)} x2={toX(0)} y1={PAD.top} y2={PAD.top + ALTO} stroke="#6b7280" strokeWidth="1" strokeDasharray="3 3" />
        <text x={toX(0) + 3} y={PAD.top - 6} fontSize="8.5" fill="#6b7280">hoy</text>

        {/* Punto de partida */}
        <circle cx={toX(0)} cy={toY(precioHoy)} r="3" fill="#1e40af" />

        {/* Eje X: todos los días */}
        {bandas.map((b, i) => {
          const x = toX(b.d);
          const step = bandas.length > 6 ? 1 : 1;
          if (i % step !== 0) return null;
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={PAD.top + ALTO} y2={PAD.top + ALTO + 3} stroke="#d1d5db" strokeWidth="1" />
              <text x={x} y={H - 22} fontSize="8" fill="#9ca3af" textAnchor="middle">
                {formatFecha(b.fecha)}
              </text>
            </g>
          );
        })}

        {/* Si hay caso activo, mostrar puntos con precio */}
        {casoData && casoData.puntos.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="2" fill="#1e40af" />
            <text x={p.x} y={p.y - 6} fontSize="7.5" fill="#1e40af" textAnchor="middle" fontWeight="600">
              {p.valor.toFixed(1)}
            </text>
          </g>
        ))}
      </svg>

      {/* Footer con info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '10.5px',
          color: 'var(--v3-text-mute)',
          marginTop: '6px',
          flexWrap: 'wrap',
          gap: '6px'
        }}
      >
        <span>
          Inicio: <strong style={{ color: 'var(--v3-text)' }}>{precioHoy?.toFixed(2)} €</strong>
          {casoData ? (
            <> · Caso {casoData.idx + 1} · {formatFecha(casoData.fechaInicio)} · <strong style={{ color: casoData.variacion >= 0 ? '#166534' : '#991b1b' }}>{casoData.variacion >= 0 ? '+' : ''}{casoData.variacion.toFixed(2)}%</strong></>
          ) : (
            <> · {casos.length} casos · mediana</>
          )}
        </span>
        <span style={{ display: 'inline-flex', gap: '8px' }}>
          <span><span style={{ display: 'inline-block', width: '10px', height: '8px', background: 'rgba(37, 99, 235, 0.22)', borderRadius: '2px' }} /> 50%</span>
          <span><span style={{ display: 'inline-block', width: '10px', height: '8px', background: 'rgba(37, 99, 235, 0.10)', borderRadius: '2px' }} /> 80%</span>
          <span><span style={{ display: 'inline-block', width: '12px', height: '1.6px', background: '#1e40af' }} /> mediana</span>
        </span>
      </div>

      <p style={{ fontSize: '10.5px', color: 'var(--v3-text-mute)', margin: '8px 0 0 0', lineHeight: 1.5 }}>
        Cada línea gris es un caso histórico. Pulsa "Caso 1…N" o pasa el cursor para ver su trayectoria y precios día a día. "Caso medio" muestra la mediana y las bandas 50/80. <strong>No es una predicción</strong>: describe lo que ocurrió en situaciones similares del pasado.
      </p>
    </div>
  );
}
