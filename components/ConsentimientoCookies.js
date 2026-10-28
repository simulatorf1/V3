'use client';

import { useEffect } from 'react';

export default function ConsentimientoCookies() {
  useEffect(() => {
    // Cargar Cookiebot solo si no está ya cargado
    if (document.querySelector('script[data-cookiebot]')) return;

    const script = document.createElement('script');
    script.src = 'https://consent.cookiebot.com/uc.js';
    script.id = 'Cookiebot';
    script.dataset.cbid = 'TU_COOKIEBOT_ID'; // <-- Cambia esto por tu ID de Cookiebot
    script.dataset.blockingmode = 'auto';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // No eliminar el script al desmontar, Cookiebot lo necesita
    };
  }, []);

  return null;
}
