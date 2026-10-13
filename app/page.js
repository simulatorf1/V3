import Buscador from '../components/Buscador';

export default function Home() {
  return (
    <main style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '720px', margin: '0 auto' }}>
      <h1>V3 — Análisis bursátil automatizado</h1>
      <p>Busca una empresa por nombre o ticker para ver su análisis.</p>

      <Buscador />

      <p style={{ color: '#666', fontSize: '14px', marginTop: '60px' }}>
        Este contenido es un análisis estadístico generado automáticamente por un algoritmo.
        No es una recomendación de inversión.
      </p>
    </main>
  );
}
