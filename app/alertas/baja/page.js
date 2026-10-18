export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Baja de alertas — Equaty',
  robots: { index: false, follow: false }
};

export default function Baja({ searchParams }) {
  const estado = searchParams?.estado;

  let titulo = 'Suscripción cancelada';
  let mensaje =
    'Tu suscripción a las alertas de Equaty ha sido cancelada. No recibirás más emails sobre esta empresa.';
  let color = '#2e7d32';
  let fondo = '#f0fdf4';

  if (estado === 'error') {
    titulo = 'No se pudo cancelar';
    mensaje = 'El enlace no es válido o la suscripción ya no existe.';
    color = '#c62828';
    fondo = '#fef2f2';
  }

  return (
    <main
      className="v3-container"
      style={{ maxWidth: '600px', paddingTop: '80px', textAlign: 'center' }}
    >
      <div
        className="v3-card"
        style={{
          padding: '32px',
          background: fondo,
          borderLeft: `4px solid ${color}`
        }}
      >
        <h1 style={{ marginTop: 0, color }}>{titulo}</h1>
        <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--v3-text)' }}>{mensaje}</p>
        <p style={{ marginTop: '24px' }}>
          <a href="/" className="v3-btn">
            Volver al inicio
          </a>
        </p>
      </div>
    </main>
  );
}
