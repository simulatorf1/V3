import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Análisis Equaty';

export default async function Image({ params }) {
  const slug = params.slug;
  let ticker;
  if (slug.includes('__')) ticker = slug.split('__')[0].toUpperCase();
  else ticker = slug.split('-')[0].toUpperCase();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://equaty.es';
  let empresa = { nombre: ticker, ticker };
  let zona = 'intermedia';
  let precio = '—';
  let smi = '—';
  let nombreSector = '';

  try {
    const res = await fetch(`${baseUrl}/api/imagen/${ticker}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      empresa = data.empresa;
      zona = data.analisis?.zona || 'intermedia';
      precio = data.analisis?.precioActual?.toFixed(2) || '—';
      smi = data.analisis?.smiActual?.toFixed(2) || '—';
      nombreSector = empresa.sector || '';
    }
  } catch (e) {}

  const colorZona =
    zona === 'alta' ? '#cf222e' : zona === 'baja' ? '#1a7f37' : '#56606c';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%)',
          padding: '60px',
          fontFamily: 'sans-serif'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: '#0b5fff',
              letterSpacing: '-0.5px'
            }}
          >
            Equaty
          </div>
          <div style={{ fontSize: '18px', color: '#8a929c' }}>
            Análisis bursátil estadístico
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            marginTop: '20px'
          }}
        >
          <div
            style={{
              fontSize: '64px',
              fontWeight: 800,
              color: '#0f1720',
              lineHeight: 1.05
            }}
          >
            {empresa.nombre}
          </div>
          <div style={{ fontSize: '32px', color: '#56606c', marginTop: '12px' }}>
            {empresa.ticker}
            {nombreSector ? ` · ${nombreSector}` : ''}
          </div>

          <div style={{ display: 'flex', gap: '60px', marginTop: '50px' }}>
            <div>
              <div
                style={{
                  fontSize: '16px',
                  color: '#8a929c',
                  textTransform: 'uppercase',
                  fontWeight: 600
                }}
              >
                Precio actual
              </div>
              <div style={{ fontSize: '52px', fontWeight: 800, color: '#0f1720' }}>{precio}</div>
            </div>
            <div>
              <div
                style={{
                  fontSize: '16px',
                  color: '#8a929c',
                  textTransform: 'uppercase',
                  fontWeight: 600
                }}
              >
                Indicador propio
              </div>
              <div style={{ fontSize: '52px', fontWeight: 800, color: colorZona }}>{smi}</div>
            </div>
            <div>
              <div
                style={{
                  fontSize: '16px',
                  color: '#8a929c',
                  textTransform: 'uppercase',
                  fontWeight: 600
                }}
              >
                Zona
              </div>
              <div style={{ fontSize: '52px', fontWeight: 800, color: colorZona }}>{zona}</div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '20px', color: '#8a929c', marginTop: '20px' }}>
          equaty.es — Análisis estadístico. No es recomendación de inversión.
        </div>
      </div>
    ),
    { ...size }
  );
}
