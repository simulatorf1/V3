import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ padding: '60px 24px', maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '32px' }}>Página no encontrada</h1>
      <p style={{ color: '#666' }}>
        No se han encontrado datos suficientes para esta empresa. Prueba con otro nombre o ticker.
      </p>
      <p style={{ marginTop: '30px' }}>
        <Link
          href="/"
          style={{
            background: '#0070f3',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '6px',
            textDecoration: 'none'
          }}
        >
          Volver al inicio
        </Link>
      </p>
    </main>
  );
}
