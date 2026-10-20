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
      style={{ marginTop: esSidebar ? '0' : '30px', marginBottom:
esSidebar ? '28px' : '0' }}
    >
      {!esSidebar && <h2 className="v3-seccion-titulo">Movimientos de hoy</h2>}
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
          Movimientos de hoy
        </h3>
      )}

      <div
        style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          border: '2px solid #3b82f6',
          borderRadius: 'var(--v3-radius)',
          padding: esSidebar ? '14px' : '20px'
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
              Empresas que han cambiado de movimiento en las últimas 24 horas.
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
              ¿Quieres recibir un aviso cuando cambie el movimiento de
tu empresa? Entra en su
              ficha y suscríbete. Es gratis.
            </p>
          </>
        )}

        {esSidebar && (
          <p
            style={{
              margin: '0 0 10px 0',
              fontSize: '11px',
              color: '#ea580c',
              fontWeight: 600,
              lineHeight: 1.4
            }}
          >
            Suscríbete en la ficha de tu empresa para recibir avisos gratis.
          </p>
        )}

        <ul style={{ listStyle: 'none', padding: 0, margin: 0,
display: 'grid', gap: '8px' }}>
          {cambios.slice(0, esSidebar ? 5 : 8).map((c) => {
            const colorNuevo =
              c.movimientoNuevo === 'compra' ? 'var(--v3-positive)' :
'var(--v3-negative)';
            const colorAnterior =
              c.movimientoAnterior === 'compra' ? 'var(--v3-positive)'
: 'var(--v3-negative)';

            return (
              <li key={c.ticker}>
                <Link
                  href={`/analisis/${construirSlug(c)}`}
                  style={{
                    display: 'flex',
                    flexDirection: esSidebar ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: esSidebar ? 'flex-start' : 'center',
                    gap: esSidebar ? '4px' : '12px',
                    padding: esSidebar ? '8px 10px' : '12px 16px',
                    background: '#fff',
                    borderRadius: 'var(--v3-radius-sm)',
                    textDecoration: 'none',
                    color: 'var(--v3-text)',
                    border: '1px solid #bfdbfe'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: esSidebar ? '13px' : '14px',
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
                        marginTop: '2px'
                      }}
                    >
                      {c.ticker}
                      {c.sector && !esSidebar && ` · ${c.sector}`}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: esSidebar ? '11px' : '13px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span style={{ color: colorAnterior
}}>{c.movimientoAnterior}</span>
                    {' → '}
                    <span style={{ color: colorNuevo
}}>{c.movimientoNuevo}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
