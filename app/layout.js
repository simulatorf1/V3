import '../app/globals.css';
import Cabecera from '../components/Cabecera';
import Pie from '../components/Pie';

const BASE_URL = 'https://v3-rho-weld.vercel.app';

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'V3 — Análisis bursátil estadístico',
    template: '%s'
  },
  description:
    'Análisis estadístico de empresas cotizadas elaborado por el equipo de V3. No es recomendación de inversión.',
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'V3 — Análisis bursátil estadístico',
    description:
      'Análisis estadístico de empresas cotizadas elaborado por el equipo de V3. No es recomendación de inversión.',
    url: BASE_URL,
    siteName: 'V3',
    locale: 'es_ES',
    type: 'website'
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
          color: '#111',
          background: '#fff'
        }}
      >
        <Cabecera />
        <div style={{ minHeight: '60vh' }}>{children}</div>
        <Pie />
      </body>
    </html>
  );
}
