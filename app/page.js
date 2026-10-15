import Buscador from '../components/Buscador';
import UltimaConsulta from '../components/UltimaConsulta';
import CambiosRecientes from '../components/CambiosRecientes';
import SectoresPrincipales from '../components/SectoresPrincipales';
import NoticiasRecientes from '../components/NoticiasRecientes';
import { supabase } from '../lib/supabase';

export const dynamic = 'force-dynamic';

async function cargarDatos() {
  const vacio = { cambios: [], sectores: [], noticias: [] };

  try {
    const hace48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const [paginasRes, empresasRes, noticiasRes] = await Promise.all([
      supabase
        .from('paginas')
        .select('ticker, datos, actualizado_at')
        .gte('actualizado_at', hace48h)
        .order('actualizado_at', { ascending: false })
        .limit(20),
      supabase.from('empresas').select('ticker, nombre, sector'),
      supabase
        .from('noticias')
        .select('ticker, titulo, fuente, url, fecha_publicacion')
        .order('fecha_publicacion', { ascending: false })
        .limit(10)
    ]);

    const paginas = paginasRes?.data || [];
    const empresas = empresasRes?.data || [];
    const noticias = noticiasRes?.data || [];

    const empresasMap = {};
    for (const e of empresas) {
      if (e && e.ticker) empresasMap[e.ticker] = e;
    }

    const cambios = [];
    for (const p of paginas) {
      if (!p || !p.datos) continue;
      const emp = empresasMap[p.ticker];
      if (!emp) continue;
      cambios.push({
        ticker: p.ticker,
        nombre: emp.nombre,
        sector: emp.sector,
        zona: p.datos.zona,
        precio: p.datos.precioActual,
        actualizado_at: p.actualizado_at
      });
    }

    const conteoSectores = {};
    for (const e of empresas) {
      if (!e || !e.sector) continue;
      conteoSectores[e.sector] = (conteoSectores[e.sector] || 0) + 1;
    }
    const sectores = Object.entries(conteoSectores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([sector, empresas]) => ({ sector, empresas }));

    return { cambios, sectores, noticias };
  } catch (e) {
    console.error('[home] Error cargando datos:', e.message);
    return vacio;
  }
}

export default async function Home() {
  const datos = await cargarDatos();

  return (
    <main className="v3-container">
      <section className="v3-hero">
        <h1>Equaty — Análisis bursátil estadístico</h1>
        <p>
          Informes estadísticos sobre empresas cotizadas. Busca cualquier valor por nombre o
          ticker.
        </p>
      </section>

      <Buscador />

      <UltimaConsulta />

      <CambiosRecientes cambios={datos.cambios} />

      <SectoresPrincipales sectores={datos.sectores} />

      <NoticiasRecientes noticias={datos.noticias} />

      <p className="v3-aviso" style={{ marginTop: '60px' }}>
        Este contenido es un registro estadístico elaborado por el equipo de Equaty. No es una
        recomendación de inversión.
      </p>
    </main>
  );
}
