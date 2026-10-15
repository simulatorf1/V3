import Buscador from '../components/Buscador';
import UltimaConsulta from '../components/UltimaConsulta';
import TopEmpresas from '../components/TopEmpresas';
import CambiosRecientes from '../components/CambiosRecientes';
import SectoresPrincipales from '../components/SectoresPrincipales';
import NoticiasRecientes from '../components/NoticiasRecientes';
import { supabase } from '../lib/supabase';

export const dynamic = 'force-dynamic';

async function cargarDatos() {
  const vacio = { top: [], cambios: [], sectores: [], noticias: [] };

  try {
    const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const hace48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const [visitasRes, paginasRes, empresasRes, noticiasRes] = await Promise.all([
      supabase
        .from('visitas')
        .select('ticker')
        .gte('created_at', hace7dias)
        .not('ticker', 'is', null),
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

    const visitas = visitasRes?.data || [];
    const paginas = paginasRes?.data || [];
    const empresas = empresasRes?.data || [];
    const noticias = noticiasRes?.data || [];

    // Top empresas
    const conteoTickers = {};
    for (const v of visitas) {
      if (!v || !v.ticker) continue;
      conteoTickers[v.ticker] = (conteoTickers[v.ticker] || 0) + 1;
    }

    const topTickers = Object.entries(conteoTickers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const empresasMap = {};
    for (const e of empresas) {
      if (e && e.ticker) empresasMap[e.ticker] = e;
    }

    const top = [];
    for (const [ticker, visitasCount] of topTickers) {
      const emp = empresasMap[ticker];
      if (emp) top.push({ ...emp, visitas: visitasCount });
    }

    // Cambios recientes
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
        actualizado_at: p.actualizado_at
      });
    }

    // Sectores
    const conteoSectores = {};
    for (const e of empresas) {
      if (!e || !e.sector) continue;
      conteoSectores[e.sector] = (conteoSectores[e.sector] || 0) + 1;
    }
    const sectores = Object.entries(conteoSectores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([sector, empresas]) => ({ sector, empresas }));

    return { top, cambios, sectores, noticias };
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

      <TopEmpresas empresas={datos.top} />

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
