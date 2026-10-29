import '../app/globals.css';
import { Inter } from 'next/font/google';
import Cabecera from '../components/Cabecera';
import Pie from '../components/Pie';
import RegistrarVisitaGlobal from '../components/RegistrarVisitaGlobal';
import CargarAnalytics from '../components/CargarAnalytics';
import CargarAdsense from '../components/CargarAdsense';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap'
});

const BASE_URL = 'https://equaty.es';

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Equaty — Análisis bursátil estadístico',
    template: '%s'
  },
  description:
    'Análisis estadístico de empresas cotizadas elaborado por el equipo de Equaty. No es recomendación de inversión.',
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'Equaty — Análisis bursátil estadístico',
    description:
      'Análisis estadístico de empresas cotizadas elaborado por el equipo de Equaty. No es recomendación de inversión.',
    url: BASE_URL,
    siteName: 'Equaty',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Equaty — Análisis bursátil estadístico'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Equaty — Análisis bursátil estadístico',
    description:
      'Análisis estadístico de empresas cotizadas elaborado por el equipo de Equaty. No es recomendación de inversión.',
    images: [`${BASE_URL}/og-image.png`]
  },
  robots: {
    index: true,
    follow: true
  },
  other: {
    'google-adsense-account': 'ca-pub-4266340077922462'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.className}>
      <head>
        {/* Passiro PRIMERO - único script en el head */}
        <script
          src="https://cdn.passiro.com/passiro.js"
          data-site-id="ac3c0f6d4c8620f8df718345d967d98b"
        ></script>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          color: '#111',
          background: '#fff'
        }}
      >
        <RegistrarVisitaGlobal />
        <Cabecera />
        <div style={{ minHeight: '60vh' }}>{children}</div>
        <Pie />
        <CargarAnalytics />
        <CargarAdsense />
      </body>
    </html>
  );
}
