export const metadata = {
  title: 'Contacto — V3',
  description: 'Contacto de V3.'
};

export default function Contacto() {
  return (
    <main className="v3-container" style={{ maxWidth: '820px' }}>
      <h1>Contacto</h1>

      <p>
        Para cualquier consulta, sugerencia o solicitud relacionada con el sitio, puede escribir a:
      </p>

      <p style={{ fontSize: '18px', fontWeight: 700 }}>info@ibexia.es</p>

      <p className="v3-aviso-mute" style={{ marginTop: '40px' }}>
        No atendemos consultas sobre empresas concretas ni ofrecemos asesoramiento financiero.
      </p>
    </main>
  );
}
