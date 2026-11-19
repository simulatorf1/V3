'use client';

import { useEffect } from 'react';

export default function TituloDinamico({ titulo }) {
  useEffect(() => {
    if (titulo && typeof document !== 'undefined') {
      document.title = titulo;
    }
  }, [titulo]);

  // Renderizar un span oculto para forzar la hidratación
  return <span style={{ display: 'none' }} aria-hidden="true" />;
}
