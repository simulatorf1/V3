'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWatchlist } from './WatchlistContext';

function construirSlug(item) {
  const nombreLimpio = (item.nombre || item.ticker)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${item.ticker.toLowerCase()}__${nombreLimpio}`;
}

export default function ActividadFavoritos({ empresas, modo = 'completo' }) {
  const { lista, listo, estados } = useWatchlist();
  const [actividad, setActividad] = useState(null);

  useEffect(() => {
    if (!listo) return;
    if (!lista || lista.length === 0) {
      setActividad(null);
      return;
    }
    if (!empresas || empresas.length === 0) return;

    const empresasDeLista = empresas.filter((e) => lista.includes(e.ticker));

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

    setActividad({ cambiadoZona, entradoAlta, entradoBaja, nuevosMaximos, total: empresasDeLista.length });
  }, [listo, lista, empresas, estados]);

  if (!actividad) return null;
  if (actividad.cambiadoZona === 0 && actividad.entradoAlta === 0 && actividad.entradoBaja === 0) return null;

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
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e40af', marginBottom: '4px' }}>
          Actividad reciente en tus favoritos
        </div>
        <div style={{ fontSize: '13px', color: 'var(--v3-text)' }}>
          {actividad.cambiadoZona === 1
            ? '1 empresa ha cambiado de zona esta semana.'
            : `${actividad.cambiadoZona} empresas han cambiado de zona esta semana.`}
          {' '}
          <Link href="/favoritos" style={{ color: '#1e40af', fontWeight: 600, textDecoration: 'underline' }}>
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
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e40af', marginBottom: '8px' }}>
        En tus favoritos esta semana
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '4px', fontSize: '13px' }}>
        {actividad.cambiadoZona > 0 && (
          <li>• {actividad.cambiadoZona} empresa{actividad.cambiadoZona === 1 ? '' : 's'} han cambiado de zona.</li>
        )}
        {actividad.entradoAlta > 0 && (
          <li>• {actividad.entradoAlta} empresa{actividad.entradoAlta === 1 ? '' : 's'} han entrado en zona alta.</li>
        )}
        {actividad.entradoBaja > 0 && (
          <li>• {actividad.entradoBaja} empresa{actividad.entradoBaja === 1 ? '' : 's'} han entrado en zona baja.</li>
        )}
        {actividad.nuevosMaximos > 0 && (
          <li>• {actividad.nuevosMaximos} empresa{actividad.nuevosMaximos === 1 ? '' : 's'} han mejorado su variación 60 en más de 5 puntos.</li>
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
