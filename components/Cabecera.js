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
    <header className="v3-header">
      <div className="v3-header-inner">
        <Link href="/" className="v3-logo">
          Equaty
        </Link>

        <form action="/buscar" method="GET" className="v3-header-buscar">
          <input
            type="text"
            name="q"
            placeholder="Busca una empresa o ticker…"
            aria-label="Buscar empresa"
          />
        </form>

        <nav className="v3-menu-desktop">
          {enlaces.map((e) => (
            <Link key={e.href} href={e.href}>
              {e.texto}
            </Link>
          ))}
        </nav>

        <a
          href="https://x.com/Equaty_web"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: '#000',
            color: '#fff',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          𝕏 Síguenos
        </a>

        <button
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="v3-menu-boton"
          aria-label="Abrir menú"
          style={{ marginLeft: '8px' }}
        >
          ☰
        </button>
      </div>

      {menuAbierto && (
        <nav className="v3-menu-movil">
          {enlaces.map((e) => (
            <Link key={e.href} href={e.href} onClick={() => setMenuAbierto(false)}>
              {e.texto}
            </Link>
          ))}
          <a
            href="https://x.com/Equaty_web"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuAbierto(false)}
            style={{ color: '#000', fontWeight: 600, textDecoration: 'none' }}
          >
            𝕏 Síguenos
          </a>
        </nav>
      )}
    </header>
  );
}
