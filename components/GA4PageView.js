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
    const maxIntentos = 10;

    const enviar = () => {
      if (cancelado) return;

      // Intentar leer el título del <h1> (que viene del servidor y es correcto)
      const h1 = document.querySelector('h1');
      const tituloH1 = h1 ? h1.textContent.trim() : '';
      
      // Si hay un <h1> con contenido, usarlo para actualizar el título
      if (tituloH1 && tituloH1.length > 0 && !tituloH1.includes('Cargando')) {
        const tituloCompleto = `${tituloH1} | Equaty`;
        if (document.title !== tituloCompleto) {
          document.title = tituloCompleto;
        }
      }

      const pagePath = window.location.pathname + window.location.search;
      const pageLocation = window.location.href;
      const pageTitle = document.title || '';

      if (pageTitle === tituloAnterior.current && intentos < maxIntentos) {
        intentos++;
        setTimeout(enviar, 50);
        return;
      }

      tituloAnterior.current = pageTitle;

      window.gtag('set', {
        page_path: pagePath,
        page_location: pageLocation,
        page_title: pageTitle
      });

      window.gtag('event', 'page_view', {
        page_path: pagePath,
        page_location: pageLocation,
        page_title: pageTitle
      });
    };

    const timer = setTimeout(enviar, 100);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [pathname, searchParams]);

  return null;
}
