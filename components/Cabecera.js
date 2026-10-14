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
          V3
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

        <button
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="v3-menu-boton"
          aria-label="Abrir menú"
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
        </nav>
      )}
    </header>
  );
}
