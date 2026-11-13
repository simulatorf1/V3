import Buscador from '../components/Buscador';
import RankingTabla from '../components/RankingTabla';
import WatchlistBloque from '../components/WatchlistBloque';
import ActividadFavoritos from '../components/ActividadFavoritos';
import WatchlistZona from '../components/WatchlistZona';
import { supabase } from '../lib/supabase';


async function cargarDatos() {
  const vacio = {
    ranking: [],
    totalRanking: 0,
    empresas: []
  };

  try {
    const [paginasRes, empresasRes] = await Promise.all([
      supabase
        .from('paginas')
        .select('ticker, precio_actual, zona, variacion60, percentil, smi_actual, smi_ultimos_3')
        .order('actualizado_at', { ascending: false })
        .limit(100),
      supabase.from('empresas').select('ticker, nombre, sector')
    ]);

    const paginas = paginasRes?.data || [];
    const empresas = empresasRes?.data || [];

    const empresasMap = {};
    for (const e of empresas) {
      if (e && e.ticker) empresasMap[e.ticker] = e;
    }

    const ranking = [];
    const empresasLigeras = [];

    for (const p of paginas) {
      const emp = empresasMap[p.ticker];
      if (!emp) continue;

      const item = {
        ticker: p.ticker,
        nombre: emp.nombre,
        sector: emp.sector,
        precio: p.precio_actual,
        zona: p.zona,
        variacion60: p.variacion60,
        percentil: p.percentil
      };

      ranking.push(item);

      empresasLigeras.push({
        ticker: p.ticker,
        nombre: emp.nombre,
        sector: emp.sector,
        precio: p.precio_actual,
        zona: p.zona,
        variacion60: p.variacion60
      });
    }

    const rankingOrdenado = ranking
      .filter((i) => i.variacion60 !== null && i.variacion60 !== undefined)
      .sort((a, b) => b.variacion60 - a.variacion60);

    return {
      ranking: rankingOrdenado.slice(0, 15),
      totalRanking: rankingOrdenado.length,
      empresas: empresasLigeras
    };
  } catch (e) {
    console.error('[home] Error cargando datos:', e.message);
    return vacio;
  }
}

export default async function Home() {
  const datos = await cargarDatos();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Equaty',
    alternateName: 'Equaty.es',
    url: 'https://equaty.es/'
  };

  return (
    <main className="v3-container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c')
        }}
      />

      <section className="v3-hero">
        <h1>Equaty — Análisis bursátil estadístico</h1>
        <p>
          Informes estadísticos sobre empresas cotizadas. Busca cualquier valor por nombre o
          ticker.
        </p>
      </section>

      <Buscador />

      <WatchlistZona>
        <div className="v3-home-grid" style={{ marginTop: '16px' }}>
          <div className="v3-span-2">
            <ActividadFavoritos empresas={datos.empresas} modo="completo" />
          </div>

          <div className="v3-span-2">
            <WatchlistBloque empresas={datos.empresas} />
          </div>

          <div className="v3-span-2">
            <RankingTabla
              items={datos.ranking}
              tipo="variacion60"
              titulo="Top 15 por variación en 60 sesiones"
              total={datos.totalRanking}
              colapsable={true}
              verTodasHref="/empresas"
              filasIniciales={6}
            />
          </div>
        </div>
      </WatchlistZona>

      <p className="v3-aviso" style={{ marginTop: '60px' }}>
        Este contenido es un registro estadístico elaborado por el equipo de Equaty. No es una
        recomendación de inversión.
      </p>
    </main>
  );
}
