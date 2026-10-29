import '../app/globals.css';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import Cabecera from '../components/Cabecera';
import Pie from '../components/Pie';
import RegistrarVisitaGlobal from '../components/RegistrarVisitaGlobal';
import { GoogleAnalytics } from '@next/third-parties/google';

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
        {/* Passiro PRIMERO - él bloqueará Analytics y AdSense hasta el consentimiento */}
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

        {/* Analytics con @next/third-parties. Passiro lo detecta y lo bloquea hasta el consentimiento. */}
        <GoogleAnalytics gaId="G-LVV061GCPF" />

        {/* AdSense con next/script. Passiro lo detecta y lo bloquea hasta el consentimiento. */}
        <Script
          id="adsbygoogle-init"
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4266340077922462"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}
