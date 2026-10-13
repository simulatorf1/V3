export const metadata = {
  title: 'Términos y Condiciones — V3',
  description: 'Términos y condiciones de uso de V3.'
};

export default function Terminos() {
  return (
    <main style={{ padding: '40px 24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Términos y Condiciones</h1>

      <p>
        El acceso y uso de este sitio implican la aceptación de los presentes términos.
      </p>

      <h2>Uso permitido</h2>
      <ul>
        <li>El contenido puede consultarse libremente, sin registro.</li>
        <li>No se permite la reproducción masiva automatizada del contenido sin autorización.</li>
        <li>No se permite el uso del contenido con fines ilícitos.</li>
      </ul>

      <h2>Exención de responsabilidad</h2>
      <p>
        Este sitio no ofrece asesoramiento financiero, fiscal, legal ni de inversión. El contenido
        es informativo y estadístico. El usuario es el único responsable de las decisiones que tome
        a partir de la información aquí publicada.
      </p>

      <h2>Modificaciones</h2>
      <p>
        Los presentes términos pueden actualizarse sin previo aviso. La versión vigente es la
        publicada en esta página.
      </p>
    </main>
  );
}
