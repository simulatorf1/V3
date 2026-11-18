// components/CardsHorizontes.js
'use client';

import { useState } from 'react';

const cardStyle = {
  padding: '16px',
  border: '1px solid var(--v3-border)',
  borderRadius: 'var(--v3-radius-sm, 8px)',
  background: '#fff'
};
const tituloStyle = {
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  color: 'var(--v3-text-mute)',
  marginBottom: '10px'
};

function formatFecha(fechaISO) {
  if (!fechaISO) return '';
  try {
    const d = new Date(fechaISO + 'T00:00:00');
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return '';
  }
}

function formatVar(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

function CasosLista({ casos }) {
  if (!casos || casos.length === 0) return null;
  return (
    <div style={{ marginTop: '10px', display: 'grid', gap: '4px' }}>
      {casos.map((c, i) => (
        <div
          key={i}
          style={{
            fontSize: '11px',
            color: 'var(--v3-text-soft)',
            padding: '5px 0',
            borderBottom: '1px dashed var(--v3-border)',
            lineHeight: 1.5
          }}
        >
          <div>{formatFecha(c.fecha)} → {formatFecha(c.fechaFin)}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
            <span>
              {c.precioInicioReal?.toFixed(2)} € → {c.precioFinReal?.toFixed(2)} €
            </span>
            <strong style={{ color: c.variacion >= 0 ? '#166534' : '#991b1b' }}>
              {formatVar(c.variacion)}
            </strong>
          </div>
        </div>
      ))}
    </div>
  );
}

function CardHorizonte({ titulo, proyeccion, horizonte }) {
  const [abierto, setAbierto] = useState(false);

  if (!proyeccion || proyeccion.total === 0) {
    return (
      <div style={cardStyle}>
        <div style={tituloStyle}>{titulo}</div>
        <div style={{ fontSize: '12.5px', color: 'var(--v3-text-soft)' }}>
          Sin casos históricos suficientes.
        </div>
      </div>
    );
  }

  const pctSubidas = Math.round((proyeccion.subidas / proyeccion.total) * 100);
  const pctBajadas = 100 - pctSubidas;
  const lado = pctSubidas >= pctBajadas ? 'subidas' : 'bajadas';
  const pct = lado === 'subidas' ? pctSubidas : pctBajadas;
  const veces = lado === 'subidas' ? proyeccion.subidas : proyeccion.bajadas;
  const color = lado === 'subidas' ? '#16a34a' : '#dc2626';
  const retornoTxt =
    proyeccion.retornoMedio !== undefined && proyeccion.retornoMedio !== null
      ? `${proyeccion.retornoMedio >= 0 ? '+' : ''}${proyeccion.retornoMedio}%`
      : '—';

  return (
    <div style={cardStyle}>
      <div style={tituloStyle}>{titulo}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
        <div style={{ fontSize: '26px', fontWeight: 800, color }}>{pct}%</div>
        <div style={{ fontSize: '12px', color: 'var(--v3-text-soft)' }}>
          de {lado} ({veces} de {proyeccion.total})
        </div>
      </div>
      <div style={{ fontSize: '12.5px', color: 'var(--v3-text-soft)' }}>
        Retorno medio: <strong>{retornoTxt}</strong> a {horizonte}.
      </div>

      <button
        onClick={() => setAbierto(!abierto)}
        style={{
          marginTop: '10px',
          padding: '5px 10px',
          fontSize: '11.5px',
          fontWeight: 600,
          borderRadius: '999px',
          border: '1px solid var(--v3-border)',
          background: abierto ? 'var(--v3-bg-soft)' : '#fff',
          color: 'var(--v3-text)',
          cursor: 'pointer'
        }}
      >
        {abierto ? 'Ocultar casos' : `Ver los ${proyeccion.total} casos`}
      </button>

      {abierto && <CasosLista casos={proyeccion.casos} />}
    </div>
  );
}

function CardSituacion({ precioActual, variacion5, variacion60, percentil, zona, smiActual, mercado }) {
  const zonaTxt =
    zona === 'alta' ? 'parte alta del rango'
    : zona === 'baja' ? 'parte baja del rango'
    : 'parte intermedia del rango';

  return (
    <div style={cardStyle}>
      <div style={tituloStyle}>Situación actual</div>
      <div style={{ fontSize: '26px', fontWeight: 800, marginBottom: '2px' }}>
        {precioActual?.toFixed(2) ?? '—'} €
      </div>
      <div style={{ fontSize: '11px', color: 'var(--v3-text-mute)', marginBottom: '10px' }}>
        {mercado || ''}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--v3-text-mute)', fontWeight: 600, textTransform: 'uppercase' }}>
            Var. 5 sesiones
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700 }}>
            {variacion5 >= 0 ? '+' : ''}{variacion5.toFixed(2)}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--v3-text-mute)', fontWeight: 600, textTransform: 'uppercase' }}>
            Var. 60 sesiones
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700 }}>
            {variacion60 >= 0 ? '+' : ''}{variacion60.toFixed(2)}%
          </div>
        </div>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--v3-text-soft)', lineHeight: 1.5 }}>
        Indicador Equaty: <strong>{smiActual?.toFixed(0) ?? '—'}</strong> · Percentil{' '}
        <strong>{percentil ?? '—'}</strong> · {zonaTxt}
      </div>
    </div>
  );
}

export default function CardsHorizontes({
  proyeccionDiaria, proyeccionSemanal, percentil, zona, smiActual,
  precioActual, variacion5, variacion60, mercado
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}
    >
      <CardHorizonte titulo="Corto plazo (10 sesiones)" proyeccion={proyeccionDiaria} horizonte="10 sesiones" />
      <CardHorizonte titulo="Largo plazo (10 semanas)" proyeccion={proyeccionSemanal} horizonte="10 semanas" />
      <CardSituacion
        precioActual={precioActual}
        variacion5={variacion5}
        variacion60={variacion60}
        percentil={percentil}
        zona={zona}
        smiActual={smiActual}
        mercado={mercado}
      />
    </div>
  );
}
