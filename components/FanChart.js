// components/FanChart.js
// Fan chart / cono de probabilidad en SVG puro.
// Muestra las bandas 50% y 80% de las trayectorias históricas normalizadas.

const W = 700;
const H = 320;
const PAD = { top: 20, right: 20, bottom: 36, left: 48 };
const ANCHO = W - PAD.left - PAD.right;
const ALTO = H - PAD.top - PAD.bottom;

function escalaY(valores) {
  const min = Math.min(...valores, 95);
  const max = Math.max(...valores, 105);
  const margen = (max - min) * 0.08 || 1;
  const yMin = min - margen;
  const yMax = max + margen;
  const toY = (v) => PAD.top + ALTO - ((v - yMin) / (yMax - yMin)) * ALTO;
  return { toY, yMin, yMax };
}

function pathArea(bandas, campoInferior, campoSuperior, toY) {
  const puntosSup = bandas.map((b, i) => {
    const x = PAD.left + (i / (bandas.length - 1)) * ANCHO;
    return `${x},${toY(b[campoSuperior])}`;
  });
  const puntosInf = [...bandas].reverse().map((b, i) => {
    const idx = bandas.length - 1 - i;
    const x = PAD.left + (idx / (bandas.length - 1)) * ANCHO;
    return `${x},${toY(b[campoInferior])}`;
  });
  return `M ${puntosSup.join(' L ')} L ${puntosInf.join(' L ')} Z`;
}

function pathLinea(bandas, campo, toY) {
  return bandas
    .map((b, i) => {
      const x = PAD.left + (i / (bandas.length - 1)) * ANCHO;
      const y = toY(b[campo]);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

export default function FanChart({ bandas, horizonte = 'sesiones' }) {
  if (!bandas || bandas.length < 2) return null;

  const todosLosValores = bandas.flatMap((b) => [b.p10, b.p90]);
  const { toY, yMin, yMax } = escalaY(todosLosValores);

  const ticksY = 5;
  const pasoY = (yMax - yMin) / ticksY;

  return (
    <div style={{ marginTop: '12px' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="Cono de probabilidad histórica"
      >
        {/* Rejilla horizontal + etiquetas Y */}
        {Array.from({ length: ticksY + 1 }, (_, i) => {
          const valor = yMin + pasoY * i;
          const y = toY(valor);
          return (
            <g key={i}>
              <line
                x1={PAD.left}
                x2={PAD.left + ANCHO}
                y1={y}
                y2={y}
                stroke="#f0f0f0"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 6}
                y={y + 4}
                fontSize="10"
                fill="#888"
                textAnchor="end"
              >
                {valor.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Banda 80% (p10–p90) */}
        <path
          d={pathArea(bandas, 'p10', 'p90', toY)}
          fill="rgba(37, 99, 235, 0.12)"
          stroke="none"
        />

        {/* Banda 50% (p25–p75) */}
        <path
          d={pathArea(bandas, 'p25', 'p75', toY)}
          fill="rgba(37, 99, 235, 0.25)"
          stroke="none"
        />

        {/* Línea base 100 (punto de partida) */}
        <line
          x1={PAD.left}
          x2={PAD.left + ANCHO}
          y1={toY(100)}
          y2={toY(100)}
          stroke="#999"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Mediana */}
        <path
          d={pathLinea(bandas, 'p50', toY)}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Eje X: días */}
        {bandas.map((b, i) => {
          if (b.d % 2 !== 0) return null;
          const x = PAD.left + (i / (bandas.length - 1)) * ANCHO;
          return (
            <text
              key={i}
              x={x}
              y={H - 12}
              fontSize="10"
              fill="#888"
              textAnchor="middle"
            >
              {b.d}
            </text>
          );
        })}

        {/* Etiqueta eje X */}
        <text
          x={PAD.left + ANCHO / 2}
          y={H - 2}
          fontSize="10"
          fill="#888"
          textAnchor="middle"
        >
          {horizonte} tras el punto de partida
        </text>
      </svg>

      {/* Leyenda */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          fontSize: '11.5px',
          color: 'var(--v3-text-soft)',
          marginTop: '8px',
          justifyContent: 'center'
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '18px',
              height: '10px',
              background: 'rgba(37, 99, 235, 0.25)',
              display: 'inline-block',
              borderRadius: '2px'
            }}
          />
          Banda 50%
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '18px',
              height: '10px',
              background: 'rgba(37, 99, 235, 0.12)',
              display: 'inline-block',
              borderRadius: '2px'
            }}
          />
          Banda 80%
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '18px',
              height: '2.5px',
              background: '#2563eb',
              display: 'inline-block'
            }}
          />
          Mediana histórica
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '18px',
              height: '1px',
              borderTop: '1px dashed #999',
              display: 'inline-block'
            }}
          />
          Punto de partida (100)
        </span>
      </div>

      <p
        style={{
          fontSize: '11px',
          color: 'var(--v3-text-mute)',
          margin: '8px 0 0 0',
          lineHeight: 1.5,
          textAlign: 'center'
        }}
      >
        Cada trayectoria histórica se normaliza a 100 en el punto de partida. Las bandas muestran
        el rango en el que cayó el precio en el 50% y 80% central de los casos. No es una
        predicción.
      </p>
    </div>
  );
}
