import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const hace48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // Consultas en paralelo
    const [visitasResult, paginasResult, empresasResult, noticiasResult] = await Promise.all([
      supabaseAdmin
        .from('visitas')
        .select('ticker')
        .gte('created_at', hace7dias)
        .not('ticker', 'is', null),
      supabaseAdmin
        .from('paginas')
        .select('ticker, datos, actualizado_at')
        .gte('actualizado_at', hace48h)
        .order('actualizado_at', { ascending: false })
        .limit(20),
      supabaseAdmin.from('empresas').select('ticker, nombre, sector'),
      supabaseAdmin
        .from('noticias')
        .select('ticker, titulo, fuente, url, fecha_publicacion')
        .order('fecha_publicacion', { ascending: false })
        .limit(10)
    ]);

    // Top empresas
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
    for (const e of empresasResult.data || []) {
      empresasMap[e.ticker] = e;
    }

    const topEnriquecido = topTickers
      .filter((t) => empresasMap[t.ticker])
      .map((t) => ({ ...empresasMap[t.ticker], visitas: t.visitas }));

    // Cambios recientes
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

    // Sectores
    const conteoSectores = {};
    for (const e of empresasResult.data || []) {
      if (!e.sector) continue;
      conteoSectores[e.sector] = (conteoSectores[e.sector] || 0) + 1;
    }
    const sectores = Object.entries(conteoSectores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([sector, empresas]) => ({ sector, empresas }));

    return Response.json({
      top: topEnriquecido,
      cambios: cambiosRecientes,
      sectores,
      noticias: noticiasResult.data || []
    });
  } catch (err) {
    console.error('Error en /api/home:', err);
    return Response.json({ top: [], cambios: [], sectores: [], noticias: [] }, { status: 200 });
  }
}
