'use client';

import dynamic from 'next/dynamic';

const TituloDinamico = dynamic(
  () => import('./TituloDinamico'),
  { ssr: false }
);

export default function TituloDinamicoClient({ titulo }) {
  return <TituloDinamico titulo={titulo} />;
}
