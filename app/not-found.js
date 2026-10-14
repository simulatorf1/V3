import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      className="v3-container"
      style={{ maxWidth: '600px', textAlign: 'center', paddingTop: '80px' }}
    >
      <h1 style={{ fontSize: '32px' }}>Página no encontrada</h1>
      <p style={{ color: 'var(--v3-text-soft)' }}>
        No se han encontrado datos suficientes para esta empresa. Prueba con otro nombre o ticker.
      </p>
      <p style={{ marginTop: '30px' }}>
        <Link href="/" className="v3-btn">
          Volver al inicio
        </Link>
      </p>
    </main>
  );
}
