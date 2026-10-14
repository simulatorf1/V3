export const metadata = {
  title: 'Aviso Legal — V3',
  description: 'Aviso legal de V3.'
};

export default function AvisoLegal() {
  return (
    <main className="v3-container" style={{ maxWidth: '820px' }}>
      <h1>Aviso Legal</h1>

      <p>
        Este contenido ha sido generado automáticamente por un algoritmo basado en datos históricos
        de mercado. Tiene finalidad exclusivamente informativa y estadística, no constituye
        asesoramiento financiero personalizado, recomendación de inversión, oferta, solicitud o
        invitación para comprar o vender instrumentos financieros.
      </p>

      <p>
        La información se proporciona "tal cual", sin garantía de exactitud, integridad o actualidad.
        El usuario es el único responsable de sus decisiones de inversión. Invertir conlleva riesgo
        de pérdida del capital invertido. La evolución pasada no garantiza resultados futuros.
      </p>

      <h2>Conflicto de interés</h2>
      <p>
        El funcionamiento de este sitio web puede generar ingresos por publicidad. Los anunciantes
        no influyen en el contenido del algoritmo, pero puede existir un conflicto de interés
        potencial.
      </p>

      <h2>Titularidad</h2>
      <p>
        El sitio web es operado por su titular. Para cualquier comunicación, puede utilizarse el
        formulario de contacto.
      </p>
    </main>
  );
}
