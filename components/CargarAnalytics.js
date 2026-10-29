'use client';

import { useEffect, useState } from 'react';

export default function CargarAnalytics() {
  const [consentido, setConsentido] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function comprobarConsentimiento() {
      if (!window.__tcfapi) return;
      window.__tcfapi('getTCData', 2, (tcData, success) => {
        if (!success) return;
        if (!tcData.gdprApplies) {
          // Si no aplica GDPR, cargar directamente
          setConsentido(true);
          return;
        }
        if (tcData.tcString) {
          // Propósito 1 = almacenar/acceder a información (cookies analíticas)
          const aceptoEstadisticas = tcData.purpose?.consents?.[1] === true;
          setConsentido(aceptoEstadisticas);
        }
      });
    }

    // Esperar a que Passiro cargue
    const interval = setInterval(() => {
      if (window.__tcfapi) {
        clearInterval(interval);
        comprobarConsentimiento();
        window.__tcfapi('addEventListener', 2, comprobarConsentimiento);
      }
    }, 500);

    return () => {
      clearInterval(interval);
      if (window.__tcfapi) {
        try {
          window.__tcfapi('removeEventListener', 2, comprobarConsentimiento);
        } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    if (!consentido) return;
    if (typeof window === 'undefined') return;
    if (document.querySelector('script[data-analytics]')) return;

    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-LVV061GCPF';
    script1.dataset.analytics = 'true';
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.dataset.analytics = 'true';
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-LVV061GCPF');
    `;
    document.head.appendChild(script2);
  }, [consentido]);

  return null;
}
