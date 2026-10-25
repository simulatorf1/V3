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

function situacionDesdeZona(zona) {
  if (zona === 'alta') return 'parte alta';
  if (zona === 'baja') return 'parte baja';
  return 'parte intermedia';
}

function fechaLegible(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    return '';
  }
}

export default function CambiosDesdeUltimaVisita({ empresas }) {
  const { lista, listo, zonas, ultimaVisita, actualizarZonas, marcarVisita } =
    useWatchlist();
  const [cambios, setCambios] = useState([]);
  const [fechaAnterior, setFechaAnterior] = useState(null);

  useEffect(() => {
    if (!listo) return;
    if (!lista || lista.length === 0) {
      setCambios([]);
      return;
    }
    if (!empresas || empresas.length === 0) return;

    const empresasDeLista = empresas.filter((e) => lista.includes(e.ticker));

    // Comparamos la zona actual con la zona guardada de la última visita
    const cambiosDetectados = [];
    const zonasActuales = {};

    for (const e of empresasDeLista) {
      zonasActuales[e.ticker] = e.zona || null;
      const zonaAnterior = zonas[e.ticker];
      if (zonaAnterior && e.zona && zonaAnterior !== e.zona) {
        cambiosDetectados.push({
          ticker: e.ticker,
          nombre: e.nombre,
          sector: e.sector,
          zonaAnterior,
          zonaActual: e.zona
        });
      }
    }

    // Guardamos la fecha de la última visita antes de sobreescribirla
    setFechaAnterior(ultimaVisita);

    // Actualizamos las zonas guardadas y marcamos esta visita
    actualizarZonas(zonasActuales);
    marcarVisita();

    setCambios(cambiosDetectados);
  }, [listo, lista, empresas]);

  if (!listo) return null;
  if (!lista || lista.length === 0) return null;
  if (cambios.length === 0) return null;

  return (
    <section className="v3-seccion" style={{ marginBottom: '20px' }}>
      <div
        className="v3-card"
        style={{
          padding: '16px 20px',
          background: '#eff6ff',
          borderLeft: '4px solid #2563eb'
        }}
      >
        <h2 style={{ margin: '0 0 8px 0', fontSize: '15px' }}>
          {fechaAnterior
            ? `Desde tu última visita (${fechaLegible(fechaAnterior)})`
            : 'Cambios desde tu última visita'}
        </h2>
        <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--v3-text-soft)' }}>
          {cambios.length === 1
            ? '1 empresa que sigues ha cambiado de zona:'
            : `${cambios.length} empresas que sigues han cambiado de zona:`}
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '6px' }}>
          {cambios.map((c) => (
            <li key={c.ticker}>
              <Link
                href={`/analisis/${construirSlug(c)}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '6px 10px',
                  background: '#fff',
                  border: '1px solid var(--v3-border)',
                  borderRadius: 'var(--v3-radius-sm)',
                  textDecoration: 'none',
                  color: 'var(--v3-text)',
                  fontSize: '13px'
                }}
              >
                <span style={{ fontWeight: 600 }}>{c.nombre}</span>
                <span style={{ color: 'var(--v3-text-soft)', fontSize: '12px' }}>
                  {situacionDesdeZona(c.zonaAnterior)} → {situacionDesdeZona(c.zonaActual)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
