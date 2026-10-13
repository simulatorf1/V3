'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Cabecera() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const enlaces = [
    { href: '/empresas', texto: 'Empresas' },
    { href: '/sectores', texto: 'Sectores' },
    { href: '/posiciones', texto: 'Posiciones de referencia' },
    { href: '/noticias', texto: 'Noticias' },
    { href: '/metodologia', texto: 'Metodología' }
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#fff',
        borderBottom: '1px solid #e0e0e0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#111',
            textDecoration: 'none',
            flexShrink: 0
          }}
        >
          V3
        </Link>

        {/* Buscador en cabecera */}
        <form
          action="/buscar"
          method="GET"
          style={{
            flex: 1,
            maxWidth: '420px',
            display: 'flex',
            gap: '6px'
          }}
        >
          <input
            type="text"
            name="q"
            placeholder="Busca una empresa o ticker…"
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '6px'
            }}
          />
        </form>

        {/* Menú escritorio */}
        <nav
          style={{
            display: 'none',
            gap: '20px',
            marginLeft: 'auto',
            fontSize: '14px'
          }}
          className="v3-menu-desktop"
        >
          {enlaces.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              style={{ color: '#333', textDecoration: 'none' }}
            >
              {e.texto}
            </Link>
          ))}
        </nav>

        {/* Botón móvil */}
        <button
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="v3-menu-boton"
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: '1px solid #ccc',
            borderRadius: '6px',
            padding: '6px 10px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ☰
        </button>
      </div>

      {/* Menú móvil desplegado */}
      {menuAbierto && (
        <nav
          className="v3-menu-movil"
          style={{
            background: '#fff',
            borderTop: '1px solid #e0e0e0',
            padding: '12px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontSize: '14px'
          }}
        >
          {enlaces.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              onClick={() => setMenuAbierto(false)}
              style={{ color: '#333', textDecoration: 'none' }}
            >
              {e.texto}
            </Link>
          ))}
        </nav>
      )}


    </header>
  );
}
