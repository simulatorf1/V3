import '../app/globals.css';
import Cabecera from '../components/Cabecera';
import Pie from '../components/Pie';

export const metadata = {
  title: 'V3 — Análisis bursátil automatizado',
  description:
    'Análisis estadístico automatizado de empresas cotizadas. No es recomendación de inversión.'
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
