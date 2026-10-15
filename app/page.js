import Buscador from '../components/Buscador';
import UltimaConsulta from '../components/UltimaConsulta';
import TopEmpresas from '../components/TopEmpresas';
import CambiosRecientes from '../components/CambiosRecientes';
import SectoresPrincipales from '../components/SectoresPrincipales';
import NoticiasRecientes from '../components/NoticiasRecientes';
import { supabase } from '../lib/supabase';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // ============================================================
  // Consultas en paralelo a Supabase
  // ============================================================
  const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const hace48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const [visitasResult, paginasResult, empresasResult, noticiasResult] = await Promise.all([
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

  // ============================================================
  // Top empresas (más consultadas 7 días)
  // ============================================================
  const conteoTickers = {};
  for (const v of visitasResult.data || []) {
    if (!v.ticker) continue;
    conteoTickers[v.ticker] = (conteoTickers[v.ticker] || 0) + 1;
  }

  const topTickers = Object.entries(conteoTickers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([ticker, visitas]) => ({ ticker, visitas }));

  const empresasMap = {};
  console.log('[home] visitas:', visitasResult.data?.length);
  console.log('[home] tickers:', Object.keys(conteoTickers));
  console.log('[home] topTickers:', topTickers);
  console.log('[home] empresas:', empresasResult.data?.length);
  console.log('[home] topEnriquecido:', topEnriquecido.length);
  for (const e of empresasResult.data || []) {
    empresasMap[e.ticker] = e;
  }

  const topEnriquecido = topTickers
    .filter((t) => empresasMap[t.ticker])
    .map((t) => ({ ...empresasMap[t.ticker], visitas: t.visitas }));

  // ============================================================
  // Cambios recientes (últimas 48h)
  // ============================================================
  const cambiosRecientes = [];
  for (const p of paginasResult.data || []) {
    if (!p.datos) continue;
    const emp = empresasMap[p.ticker];
    if (!emp) continue;
    cambiosRecientes.push({
      ticker: p.ticker,
      nombre: emp.nombre,
      sector: emp.sector,
      zona: p.datos.zona,
      actualizado_at: p.actualizado_at
    });
  }

  // ============================================================
  // Sectores
  // ============================================================
  const conteoSectores = {};
  for (const e of empresasResult.data || []) {
    if (!e.sector) continue;
    conteoSectores[e.sector] = (conteoSectores[e.sector] || 0) + 1;
  }
  const sectores = Object.entries(conteoSectores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([sector, empresas]) => ({ sector, empresas }));

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

      <TopEmpresas empresas={topEnriquecido} />

      <CambiosRecientes cambios={cambiosRecientes} />

      <SectoresPrincipales sectores={sectores} />

      <NoticiasRecientes noticias={noticiasResult.data || []} />

      <p className="v3-aviso" style={{ marginTop: '60px' }}>
        Este contenido es un registro estadístico elaborado por el equipo de Equaty. No es una
        recomendación de inversión.
      </p>
    </main>
  );
}
