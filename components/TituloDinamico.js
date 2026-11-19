'use client';

import { useEffect, useState } from 'react';

export default function TituloDinamico({ titulo }) {
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    if (montado && titulo && typeof document !== 'undefined') {
      document.title = titulo;
    }
  }, [titulo, montado]);

  return null;
}
