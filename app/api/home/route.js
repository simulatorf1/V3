import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { descargarVelas } from '../../../lib/yahoo';
import { calcularSMI, zonaSMI } from '../../../lib/indicador';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Top empresas más consultadas de la última semana
    const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: visitas } = await supabaseAdmin
      .from('visitas')
      .select('ticker')
      .gte('created_at', hace7dias)
      .not('ticker', 'is', null);

    const conteoTickers = {};
    for (const v of visitas || []) {
      if (!v.ticker) continue;
      conteoTickers[v.ticker] = (conteoTickers[v.ticker] || 0) + 1;
    }
    const topTickers = Object.entries(conteoTickers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([ticker, visitas]) => ({ ticker, visitas }));

    // Enriquecer con nombre desde la tabla empresas
    const topEnriquecido = [];
    for (const t of topTickers) {
      const { data: emp } = await supabaseAdmin
        .from('empresas')
        .select('ticker, nombre, sector')
        .eq('ticker', t.ticker)
        .maybeSingle();
      if (emp) topEnriquecido.push({ ...emp, visitas: t.visitas });
    }

    // 2. Cambios recientes: páginas actualizadas en las últimas 48h
    const hace48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: paginas } = await supabaseAdmin
      .from('paginas')
      .select('ticker, datos, actualizado_at')
      .gte('actualizado_at', hace48h)
      .order('actualizado_at', { ascending: false })
      .limit(20);

    const cambiosRecientes = [];
    for (const p of paginas || []) {
      if (!p.datos) continue;
      const zona = p.datos.zona;
      const smi = p.datos.smiActual;
      const precio = p.datos.precioActual;
      const { data: emp } = await supabaseAdmin
        .from('empresas')
        .select('nombre, sector')
        .eq('ticker', p.ticker)
        .maybeSingle();
      if (!emp) continue;
      cambiosRecientes.push({
        ticker: p.ticker,
        nombre: emp.nombre,
        sector: emp.sector,
        zona,
        smi,
        precio,
        actualizado_at: p.actualizado_at
      });
    }

    // 3. Sectores principales: agrupar empresas por sector
    const { data: empresas } = await supabaseAdmin
      .from('empresas')
      .select('sector')
      .not('sector', 'is', null);

    const conteoSectores = {};
    for (const e of empresas || []) {
      if (!e.sector) continue;
      conteoSectores[e.sector] = (conteoSectores[e.sector] || 0) + 1;
    }
    const sectores = Object.entries(conteoSectores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([sector, empresas]) => ({ sector, empresas }));

    // 4. Noticias recientes: últimos titulares de la tabla noticias
    const { data: noticiasData } = await supabaseAdmin
      .from('noticias')
      .select('ticker, titulo, fuente, url, fecha_publicacion')
      .order('fecha_publicacion', { ascending: false })
      .limit(10);

    return Response.json({
      top: topEnriquecido,
      cambios: cambiosRecientes,
      sectores,
      noticias: noticiasData || []
    });
  } catch (err) {
    console.error('Error en /api/home:', err);
    return Response.json(
      { top: [], cambios: [], sectores: [], noticias: [] },
      { status: 200 }
    );
  }
}
