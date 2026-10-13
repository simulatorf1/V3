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
    <footer
      style={{
        borderTop: '1px solid #e0e0e0',
        marginTop: '60px',
        padding: '32px 24px',
        background: '#fafafa',
        fontSize: '13px',
        color: '#666'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            justifyContent: 'center',
            marginBottom: '20px'
          }}
        >
          {enlaces.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              style={{ color: '#666', textDecoration: 'none' }}
            >
              {e.texto}
            </Link>
          ))}
        </div>

        <p style={{ lineHeight: '1.6', textAlign: 'center', margin: '0 0 12px 0' }}>
          Este contenido ha sido generado automáticamente por un algoritmo basado en datos históricos de mercado.
          Tiene finalidad exclusivamente informativa y estadística, no constituye asesoramiento financiero
          personalizado, recomendación de inversión, oferta, solicitud o invitación para comprar o vender
          instrumentos financieros. La información se proporciona "tal cual", sin garantía de exactitud,
          integridad o actualidad. El usuario es el único responsable de sus decisiones de inversión.
          Invertir conlleva riesgo de pérdida del capital invertido. La evolución pasada no garantiza resultados futuros.
        </p>

        <p style={{ lineHeight: '1.6', textAlign: 'center', margin: 0 }}>
          El funcionamiento de este sitio web puede generar ingresos por publicidad. Los anunciantes no influyen
          en el contenido del algoritmo, pero puede existir un conflicto de interés potencial.
        </p>
      </div>
    </footer>
  );
}
