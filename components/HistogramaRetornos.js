// components/HistogramaRetornos.js
// Histograma de distribución de retornos en SVG puro.

const W = 700;
const H = 280;
const PAD = { top: 20, right: 20, bottom: 40, left: 40 };
const ANCHO = W - PAD.left - PAD.right;
const ALTO = H - PAD.top - PAD.bottom;

export default function HistogramaRetornos({ distribucion, horizonte = 'sesiones' }) {
  if (!distribucion || distribucion.length === 0) return null;

  const maxCount = Math.max(...distribucion.map((b) => b.count));
  if (maxCount === 0) return null;

  const anchoBarra = ANCHO / distribucion.length;
  const separacion = Math.min(2, anchoBarra * 0.1);

  const toY = (count) => PAD.top + ALTO - (count / maxCount) * ALTO;

  return (
    <div style={{ marginTop: '12px' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="Histograma de distribución de retornos históricos"
      >
        {/* Rejilla horizontal */}
        {Array.from({ length: 5 }, (_, i) => {
          const count = (maxCount / 4) * i;
          const y = toY(count);
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
                {Math.round(count)}
              </text>
            </g>
          );
        })}

        {/* Barras */}
        {distribucion.map((bin, i) => {
          const centro = (bin.desde + bin.hasta) / 2;
          const esPositivo = centro >= 0;
          const x = PAD.left + i * anchoBarra + separacion / 2;
          const w = anchoBarra - separacion;
          const y = toY(bin.count);
          const h = PAD.top + ALTO - y;
          const color = esPositivo ? '#16a34a' : '#dc2626';
          const opacity = bin.count === 0 ? 0.15 : 0.85;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={color}
                opacity={opacity}
                rx="2"
              />
              {bin.count > 0 && (
                <text
                  x={x + w / 2}
                  y={y - 4}
                  fontSize="9"
                  fill="#666"
                  textAnchor="middle"
                >
                  {bin.count}
                </text>
              )}
            </g>
          );
        })}

        {/* Línea vertical en 0 */}
        {(() => {
          const idxCero = distribucion.findIndex(
            (b) => b.desde <= 0 && b.hasta > 0
          );
          if (idxCero < 0) return null;
          const x = PAD.left + idxCero * anchoBarra + anchoBarra / 2;
          return (
            <line
              x1={x}
              x2={x}
              y1={PAD.top}
              y2={PAD.top + ALTO}
              stroke="#333"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          );
        })()}

        {/* Etiquetas X */}
        {distribucion.map((bin, i) => {
          if (distribucion.length > 12 && i % 2 !== 0) return null;
          const centro = (bin.desde + bin.hasta) / 2;
          const x = PAD.left + i * anchoBarra + anchoBarra / 2;
          return (
            <text
              key={i}
              x={x}
              y={H - 14}
              fontSize="9"
              fill="#888"
              textAnchor="middle"
            >
              {centro.toFixed(1)}%
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
          Retorno a {horizonte} (%)
        </text>
      </svg>

      <p
        style={{
          fontSize: '11px',
          color: 'var(--v3-text-mute)',
          margin: '8px 0 0 0',
          lineHeight: 1.5,
          textAlign: 'center'
        }}
      >
        Distribución de los retornos obtenidos en los casos históricos similares. Verde = subidas,
        rojo = bajadas. La altura indica cuántos casos cayeron en cada rango.
      </p>
    </div>
  );
}
