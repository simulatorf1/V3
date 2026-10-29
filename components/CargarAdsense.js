'use client';

import { useEffect, useState } from 'react';

export default function CargarAdsense() {
  const [consentido, setConsentido] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function comprobarConsentimiento() {
      if (!window.__tcfapi) return;
      window.__tcfapi('getTCData', 2, (tcData, success) => {
        if (!success) return;
        if (!tcData.gdprApplies) {
          setConsentido(true);
          return;
        }
        if (tcData.tcString) {
          // Propósito 1 = almacenar/acceder a información (cookies publicitarias)
          const aceptoPublicidad = tcData.purpose?.consents?.[1] === true;
          setConsentido(aceptoPublicidad);
        }
      });
    }

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
    if (document.querySelector('script[data-adsense]')) return;

    const script = document.createElement('script');
    script.async = true;
    script.src =
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4266340077922462';
    script.crossOrigin = 'anonymous';
    script.dataset.adsense = 'true';
    document.head.appendChild(script);
  }, [consentido]);

  return null;
}
