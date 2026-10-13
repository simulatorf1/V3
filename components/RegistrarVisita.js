'use client';

import { useEffect } from 'react';

export default function RegistrarVisita({ ticker, ruta }) {
  useEffect(() => {
    if (!ruta) return;

    // Guardamos la última empresa consultada en cookie local
    if (ticker) {
      const unAnio = 60 * 60 * 24 * 365;
      document.cookie = `v3_ultima_empresa=${encodeURIComponent(ticker)}; max-age=${unAnio}; path=/; SameSite=Lax`;
    }

    // Registramos la visita en Supabase (silencioso, no bloquea)
    fetch('/api/visita', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker, ruta })
    }).catch(() => {});
  }, [ticker, ruta]);

  return null;
}
