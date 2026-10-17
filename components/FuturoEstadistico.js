'use client';

import { useEffect, useState } from 'react';

export default function FuturoEstadistico({ ticker }) {
  const [futuro, setFuturo] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!ticker) return;
    fetch(`/api/futuro/${encodeURIComponent(ticker)}`)
      .then((r) => r.json())
      .then((d) => setFuturo(d.futuro || null))
      .catch(() => setFuturo(null))
      .finally(() => setCargando(false));
  }, [ticker]);

  if (cargando || !futuro) return null;

  const { direccionActual, casos, ultimoCaso, mediaDias } = futuro;

  if (!casos || casos.length === 0) {
    return (
      <div
        className="v3-card"
        style={{
          padding: '16px',
          marginTop: '16px',
          borderLeft: '4px solid var(--v3-border-strong)'
        }}
      >
        <div
          style={{
            color: 'var(--v3-text-mute)',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 600,
            marginBottom: '6px'
          }}
        >
          Futuro estadístico
        </div>
        <p style={{ margin: 0, color: 'var(--v3-text-soft)', fontSize: '14px' }}>
          Sin datos suficientes en las últimas 60 sesiones. El indicador no ha pasado antes por un
          valor similar (±20 puntos) mientras{' '}
          {direccionActual === 'subiendo' ? 'subía' : 'bajaba'}.
        </p>
      </div>
    );
  }

  const fechaUltimo = new Date(ultimoCaso.fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Madrid'
  });

  return (
    <div
      className="v3-card"
      style={{
        padding: '20px',
        marginTop: '16px',
        borderLeft: '4px solid var(--v3-negative)'
      }}
    >
      <div
        style={{
          color: 'var(--v3-text-mute)',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: 600,
          marginBottom: '8px'
        }}
      >
        Futuro estadístico
      </div>

      <p style={{ margin: 0, fontSize: '14px', color: 'var(--v3-text-soft)', lineHeight: 1.6 }}>
        El indicador está ahora <strong>{direccionActual}</strong>. En las últimas 60 sesiones ha
        estado en un valor similar (±20 puntos) mientras iba en la misma dirección en{' '}
        <strong>{casos.length}</strong> {casos.length === 1 ? 'ocasión' : 'ocasiones'}.
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '8px',
          marginTop: '12px',
          flexWrap: 'wrap'
        }}
      >
        <span style={{ fontSize: '13px', color: 'var(--v3-text-soft)' }}>
          La última vez ({fechaUltimo}), tardó
        </span>
        <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--v3-negative)' }}>
          {ultimoCaso.dias}
        </span>
        <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--v3-negative)' }}>
          días
        </span>
        <span style={{ fontSize: '13px', color: 'var(--v3-text-soft)' }}>en girar.</span>
      </div>

      {casos.length > 1 && (
        <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--v3-text-soft)' }}>
          Media de las {casos.length} ocasiones: <strong>{mediaDias.toFixed(1)} días</strong>.
        </p>
      )}

      <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: 'var(--v3-text-mute)' }}>
        Esto no es una predicción. Es una descripción de lo que ha pasado otras veces en
        situaciones parecidas.
      </p>
    </div>
  );
}
