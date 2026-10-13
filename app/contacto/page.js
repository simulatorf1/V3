export const metadata = {
  title: 'Contacto — V3',
  description: 'Contacto de V3.'
};

export default function Contacto() {
  return (
    <main style={{ padding: '40px 24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Contacto</h1>

      <p>
        Para cualquier consulta, sugerencia o solicitud relacionada con el sitio, puede escribir a:
      </p>

      <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
        info@xxx.es
      </p>

      <p style={{ color: '#666', fontSize: '13px', marginTop: '40px' }}>
        No atendemos consultas sobre empresas concretas ni ofrecemos asesoramiento financiero.
      </p>
    </main>
  );
}
