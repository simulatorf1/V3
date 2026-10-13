import Buscador from '../components/Buscador';
import UltimaConsulta from '../components/UltimaConsulta';
import TopEmpresas from '../components/TopEmpresas';
import CambiosRecientes from '../components/CambiosRecientes';
import SectoresPrincipales from '../components/SectoresPrincipales';
import NoticiasRecientes from '../components/NoticiasRecientes';

export const dynamic = 'force-dynamic';

async function cargarDatosHome() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://v3-rho-weld.vercel.app';
    const res = await fetch(`${baseUrl}/api/home`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Error cargando datos');
    return await res.json();
  } catch (e) {
    return { top: [], cambios: [], sectores: [], noticias: [] };
  }
}

export default async function Home() {
  const datos = await cargarDatosHome();

  return (
    <main
      style={{
        padding: '40px 24px',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '900px',
        margin: '0 auto'
      }}
    >
      <h1 style={{ marginBottom: '6px' }}>V3 — Análisis bursátil automatizado</h1>
      <p style={{ color: '#666', marginTop: 0 }}>
        Busca cualquier empresa del mundo por nombre o ticker para ver su análisis.
      </p>

      <Buscador />

      <UltimaConsulta />

      <TopEmpresas empresas={datos.top} />

      <CambiosRecientes cambios={datos.cambios} />

      <SectoresPrincipales sectores={datos.sectores} />

      <NoticiasRecientes noticias={datos.noticias} />

      <p style={{ color: '#666', fontSize: '13px', marginTop: '60px' }}>
        Este contenido es un análisis estadístico generado automáticamente por un algoritmo.
        No es una recomendación de inversión.
      </p>
    </main>
  );
}
