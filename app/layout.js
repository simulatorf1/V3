export const metadata = {
  title: 'V3 — Análisis bursátil automatizado',
  description: 'Análisis estadístico automatizado de empresas cotizadas. No es recomendación de inversión.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
