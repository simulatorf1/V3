import '../app/globals.css';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import Cabecera from '../components/Cabecera';
import Pie from '../components/Pie';
import RegistrarVisitaGlobal from '../components/RegistrarVisitaGlobal';

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
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.className}>
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

        {/* Consent Mode v2: todo denied por defecto -> GA sin cookies, sin banner */}
        <Script id="consent-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied',
              wait_for_update: 500
            });
          `}
        </Script>

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LVV061GCPF"
          strategy="afterInteractive"
        />
        <Script id="ga-config" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-LVV061GCPF');
          `}
        </Script>
      </body>
    </html>
  );
}
