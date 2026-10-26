'use client';

import Link from 'next/link';
import { useWatchlist } from './WatchlistContext';

export default function ActividadFavoritos({ empresas, modo = 'completo' }) {
  const { lista, estados } = useWatchlist();

  if (!lista || lista.length === 0) return null;
  if (!empresas || empresas.length === 0) return null;

  const empresasDeLista = empresas.filter((e) => lista.includes(e.ticker));
  if (empresasDeLista.length === 0) return null;

  let cambiadoZona = 0;
  let entradoAlta = 0;
  let entradoBaja = 0;
  let nuevosMaximos = 0;

  for (const e of empresasDeLista) {
    const ant = estados[e.ticker];
    if (!ant) continue;
    if (ant.zona && e.zona && ant.zona !== e.zona) {
      cambiadoZona++;
      if (e.zona === 'alta') entradoAlta++;
      if (e.zona === 'baja') entradoBaja++;
    }
    if (
      ant.variacion60 !== null &&
      ant.variacion60 !== undefined &&
      e.variacion60 !== null &&
      e.variacion60 !== undefined &&
      e.variacion60 > ant.variacion60 + 5
    ) {
      nuevosMaximos++;
    }
  }

  if (cambiadoZona === 0 && entradoAlta === 0 && entradoBaja === 0 && nuevosMaximos === 0) {
    return null;
  }

  if (modo === 'compacto') {
    return (
      <div
        className="v3-card"
        style={{
          padding: '12px 16px',
          background: '#eff6ff',
          borderLeft: '3px solid #2563eb',
          marginBottom: '16px'
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#1e40af',
            marginBottom: '4px'
          }}
        >
          Actividad reciente en tus favoritos
        </div>
        <div style={{ fontSize: '13px', color: 'var(--v3-text)' }}>
          {cambiadoZona === 1
            ? '1 empresa ha cambiado de estado esta semana.'
            : `${cambiadoZona} empresas han cambiado de estado esta semana.`}
          {' '}
          <Link
            href="/favoritos"
            style={{ color: '#1e40af', fontWeight: 600, textDecoration: 'underline' }}
          >
            Ver detalle
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="v3-card"
      style={{
        padding: '16px 20px',
        background: '#eff6ff',
        borderLeft: '4px solid #2563eb',
        marginBottom: '20px'
      }}
    >
      <div
        style={{
          fontSize: '14px',
          fontWeight: 700,
          color: '#1e40af',
          marginBottom: '8px'
        }}
      >
        En tus favoritos esta semana
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '4px', fontSize: '13px' }}>
        {cambiadoZona > 0 && (
          <li>• {cambiadoZona} empresa{cambiadoZona === 1 ? '' : 's'} han cambiado de estado.</li>
        )}
        {entradoAlta > 0 && (
          <li>• {entradoAlta} empresa{entradoAlta === 1 ? '' : 's'} están ahora en parte alta.</li>
        )}
        {entradoBaja > 0 && (
          <li>• {entradoBaja} empresa{entradoBaja === 1 ? '' : 's'} están ahora en parte baja.</li>
        )}
        {nuevosMaximos > 0 && (
          <li>• {nuevosMaximos} empresa{nuevosMaximos === 1 ? '' : 's'} han mejorado su variación 60 en más de 5 puntos.</li>
        )}
      </ul>
      <Link
        href="/favoritos"
        style={{
          display: 'inline-block',
          marginTop: '10px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#1e40af',
          textDecoration: 'underline'
        }}
      >
        Ver centro de seguimiento completo →
      </Link>
    </div>
  );
}
