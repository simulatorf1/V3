'use client';

import { useEffect } from 'react';

export default function TituloDinamico({ titulo }) {
  useEffect(() => {
    if (titulo && typeof document !== 'undefined') {
      document.title = titulo;
    }
  }, [titulo]);

  return null;
}
