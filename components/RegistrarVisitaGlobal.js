'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const RUTAS_EXCLUIDAS = ['/admin'];

function estaExcluida(pathname) {
  if (!pathname) return true;
  if (pathname.startsWith('/analisis/')) return true;
  for (const r of RUTAS_EXCLUIDAS) {
    if (pathname === r || pathname.startsWith(r + '/')) return true;
  }
  return false;
}

export default function RegistrarVisitaGlobal() {
  const pathname = usePathname();
  const ultimaRutaRegistrada = useRef(null);

  useEffect(() => {
    if (!pathname) return;
    if (estaExcluida(pathname)) return;
    if (ultimaRutaRegistrada.current === pathname) return;

    const claveSesion = `v3_visita_${pathname}`;
    try {
      if (window.sessionStorage.getItem(claveSesion)) {
        ultimaRutaRegistrada.current = pathname;
        return;
      }
      window.sessionStorage.setItem(claveSesion, '1');
    } catch (e) {}

    ultimaRutaRegistrada.current = pathname;

    fetch('/api/visita', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker: null, ruta: pathname })
    }).catch(() => {});
  }, [pathname]);

  return null;
}
