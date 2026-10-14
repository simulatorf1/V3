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
        <div className="v3-footer-links">
          {enlaces.map((e) => (
            <Link key={e.href} href={e.href}>
              {e.texto}
            </Link>
          ))}
        </div>

        <p style={{ textAlign: 'center', lineHeight: '1.6', marginBottom: '12px' }}>
          Este contenido es un registro estadístico elaborado por el equipo de Equaty a partir de
          datos históricos de mercado. Tiene finalidad exclusivamente informativa y estadística,
          no constituye asesoramiento financiero personalizado, recomendación de inversión,
          oferta, solicitud o invitación para comprar o vender instrumentos financieros. La
          información se proporciona "tal cual", sin garantía de exactitud, integridad o
          actualidad. El usuario es el único responsable de sus decisiones de inversión. Invertir
          conlleva riesgo de pérdida del capital invertido. La evolución pasada no garantiza
          resultados futuros.
        </p>

        <p style={{ textAlign: 'center', lineHeight: '1.6', margin: 0 }}>
          El funcionamiento de este sitio web puede generar ingresos por publicidad. Los
          anunciantes no influyen en el contenido del informe, pero puede existir un conflicto de
          interés potencial.
        </p>
      </div>
    </footer>
  );
}
