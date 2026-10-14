import Buscador from '../components/Buscador';
import UltimaConsulta from '../components/UltimaConsulta';
import TopEmpresas from '../components/TopEmpresas';
import CambiosRecientes from '../components/CambiosRecientes';
import SectoresPrincipales from '../components/SectoresPrincipales';
import NoticiasRecientes from '../components/NoticiasRecientes';

export const dynamic = 'force-dynamic';

async function cargarDatosHome() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://equaty.es';
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
    <main className="v3-container">
      <section className="v3-hero">
        <h1>Equaty — Análisis bursátil estadístico</h1>
        <p>
          Informes estadísticos sobre empresas cotizadas. Busca cualquier valor por nombre o ticker.
        </p>
      </section>

      <Buscador />

      <UltimaConsulta />

      <TopEmpresas empresas={datos.top} />

      <CambiosRecientes cambios={datos.cambios} />

      <SectoresPrincipales sectores={datos.sectores} />

      <NoticiasRecientes noticias={datos.noticias} />

      <p className="v3-aviso" style={{ marginTop: '60px' }}>
        Este contenido es un registro estadístico elaborado por el equipo de Equaty.
        No es una recomendación de inversión.
      </p>
    </main>
  );
}
