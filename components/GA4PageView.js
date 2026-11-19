'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function GA4PageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tituloAnterior = useRef('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof window.gtag !== 'function') return;

    let cancelado = false;
    let intentos = 0;
    const maxIntentos = 10; // 10 × 50ms = 500ms máximo

    const enviar = () => {
      if (cancelado) return;

      const pagePath = window.location.pathname + window.location.search;
      const pageLocation = window.location.href;
      const pageTitle = document.title || '';

      // Si el título no ha cambiado desde el anterior y aún no hemos agotado intentos,
      // esperamos un poco más (Next.js puede tardar en aplicar el nuevo title).
      if (
        pageTitle === tituloAnterior.current &&
        intentos < maxIntentos
      ) {
        intentos++;
        setTimeout(enviar, 50);
        return;
      }

      tituloAnterior.current = pageTitle;

      // Forzar a GA4 a actualizar su page_location interno
      // para que eventos automáticos (form_start, scroll, etc.) usen la URL correcta
      window.gtag('set', {
        page_path: pagePath,
        page_location: pageLocation,
        page_title: pageTitle
      });

      // Enviar el page_view
      window.gtag('event', 'page_view', {
        page_path: pagePath,
        page_location: pageLocation,
        page_title: pageTitle
      });
    };

    // Pequeño delay inicial para dar tiempo a que Next.js aplique el título
    const timer = setTimeout(enviar, 50);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [pathname, searchParams]);

  return null;
}
