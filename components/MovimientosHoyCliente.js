'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

function construirSlug(cambio) {
  const nombreLimpio = (cambio.nombre || cambio.ticker)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${cambio.ticker.toLowerCase()}__${nombreLimpio}`;
}

export default function MovimientosHoyCliente({ variante = 'home' }) {
  const [cambios, setCambios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch('/api/movimientos')
      .then((r) => r.json())
      .then((d) => setCambios(d.movimientos || []))
      .catch(() => setCambios([]))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return null;
  if (!cambios || cambios.length === 0) return null;

  const esSidebar = variante === 'sidebar';

  return (
    <section
      className={esSidebar ? '' : 'v3-seccion'}
      style={{
        marginTop: esSidebar ? '0' : '30px',
        marginBottom: esSidebar ? '28px' : '0',
        maxWidth: '100%',
        overflow: 'hidden'
      }}
    >
      {!esSidebar && (
        <h2 className="v3-seccion-titulo">Actualizaciones del registro estadístico</h2>
      )}
      {esSidebar && (
        <h3
          style={{
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--v3-text-mute)',
            margin: '0 0 10px 0'
          }}
        >
          Actualizaciones del registro estadístico
        </h3>
      )}

      <div
        style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          border: '2px solid #3b82f6',
          borderRadius: 'var(--v3-radius)',
          padding: esSidebar ? '10px' : '20px',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        {!esSidebar && (
          <>
            <p
              style={{
                margin: '0 0 8px 0',
                fontSize: '13px',
                color: '#1e40af',
                lineHeight: 1.5
              }}
            >
              Empresas cuyo indicador estadístico ha registrado una actualización en las últimas
              24 horas. Registro meramente descriptivo.
            </p>
            <p
              style={{
                margin: '0 0 14px 0',
                fontSize: '13px',
                color: '#ea580c',
                fontWeight: 600,
                lineHeight: 1.5
              }}
            >
              Puedes suscribirte en la ficha de tu empresa para recibir actualizaciones
              estadísticas por email. Es gratis.
            </p>
          </>
        )}

        {esSidebar && (
          <p
            style={{
              margin: '0 0 8px 0',
              fontSize: '11px',
              color: '#ea580c',
              fontWeight: 600,
              lineHeight: 1.4
            }}
          >
            Suscríbete en la ficha para recibir actualizaciones estadísticas por email.
          </p>
        )}

        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gap: '6px'
          }}
        >
          {cambios.slice(0, esSidebar ? 5 : 8).map((c) => (
            <li key={c.ticker} style={{ maxWidth: '100%' }}>
              <Link
                href={`/analisis/${construirSlug(c)}`}
                style={{
                  display: 'block',
                  padding: esSidebar ? '6px 8px' : '12px 16px',
                  background: '#fff',
                  borderRadius: 'var(--v3-radius-sm)',
                  textDecoration: 'none',
                  color: 'var(--v3-text)',
                  border: '1px solid #bfdbfe',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: esSidebar ? '12px' : '14px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {c.nombre}
                </div>
                <div
                  style={{
                    color: 'var(--v3-text-soft)',
                    fontSize: '11px',
                    marginTop: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {c.ticker}
                  {c.sector && !esSidebar && ` · ${c.sector}`}
                </div>
                <div
                  style={{
                    fontSize: esSidebar ? '10px' : '12px',
                    fontWeight: 600,
                    color: 'var(--v3-text-mute)',
                    marginTop: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  actualización del registro
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
