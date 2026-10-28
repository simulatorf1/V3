'use client';

import { useEffect } from 'react';

export default function ConsentimientoCookies() {
  useEffect(() => {
    // Evitar cargar Cookiebot dos veces
    if (document.querySelector('script[data-cookiebot]')) return;

    const script = document.createElement('script');
    script.id = 'Cookiebot';
    script.src = 'https://consent.cookiebot.com/uc.js';
    script.type = 'text/javascript';
    script.async = true;
    script.setAttribute('data-cbid', '0591d20f-b01a-4d76-a320-8c7cc2e7c6bf');
    script.setAttribute('data-blockingmode', 'auto');
    script.setAttribute('data-cookiebot', 'true');
    document.head.appendChild(script);
  }, []);

  return null;
}
