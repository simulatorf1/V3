export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Suscripción confirmada — Equaty',
  robots: { index: false, follow: false }
};

export default function Confirmada({ searchParams }) {
  const estado = searchParams?.estado;

  let titulo = 'Suscripción confirmada';
  let mensaje =
    'Tu suscripción a las alertas de Equaty está activa. Recibirás un email cuando el último movimiento registrado de la empresa cambie.';
  let color = '#2e7d32';
  let fondo = '#f0fdf4';

  if (estado === 'error') {
    titulo = 'No se pudo confirmar';
    mensaje =
      'El enlace no es válido o ha caducado. Si quieres, puedes volver a suscribirte desde la página de la empresa.';
    color = '#c62828';
    fondo = '#fef2f2';
  } else if (estado === 'ya') {
    titulo = 'Ya estaba confirmada';
    mensaje = 'Tu suscripción ya estaba activa. No tienes que hacer nada más.';
    color = '#bf8700';
    fondo = '#fffbeb';
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
