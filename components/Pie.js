import Link from 'next/link';

export default function Pie() {
  const enlaces = [
    { href: '/metodologia', texto: 'Metodología' },
    { href: '/fuentes', texto: 'Fuentes' },
    { href: '/aviso-legal', texto: 'Aviso Legal' },
    { href: '/privacidad', texto: 'Política de Privacidad' },
    { href: '/cookies', texto: 'Política de Cookies' },
    { href: '/terminos', texto: 'Términos y Condiciones' },
    { href: '/contacto', texto: 'Contacto' }
  ];

  return (
    <footer className="v3-footer">
      <div className="v3-footer-inner">
        {/* Bloque X */}
        <div
          style={{
            background: '#f0f4ff',
            border: '1px solid #c7d9ff',
            borderRadius: 'var(--v3-radius-sm)',
            padding: '16px 20px',
            marginBottom: '28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '2px' }}>
              Síguenos en X
            </div>
            <div style={{ color: 'var(--v3-text-soft)', fontSize: '13px' }}>
              Datos y estadísticas en{' '}
              <strong style={{ color: '#0b5fff' }}>@Equaty_web</strong>
            </div>
          </div>
          <a
            href="https://x.com/Equaty_web"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: '#000',
              color: '#fff',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            𝕏 Seguir
          </a>
        </div>

        <div className="v3-footer-links">
          {enlaces.map((e) => (
            <Link key={e.href} href={e.href}>
              {e.texto}
            </Link>
          ))}
        </div>

        <p
          style={{
            textAlign: 'center',
            lineHeight: '1.6',
            fontSize: '12px',
            color: 'var(--v3-text-mute)',
            margin: 0
          }}
        >
          Contenido estadístico e informativo basado en datos históricos. No constituye
          asesoramiento financiero, recomendación de inversión, oferta ni solicitud de compra o
          venta de instrumentos financieros. La evolución pasada no garantiza resultados futuros.
        </p>
      </div>
    </footer>
  );
}
