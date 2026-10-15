import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');

    if (!ticker) {
      return Response.json({ relacionados: [], top: [], noticias: [] });
    }

    const tickerUpper = ticker.toUpperCase();

    // Consultas en paralelo
    const [empresaResult, noticiasResult] = await Promise.all([
      supabaseAdmin
        .from('empresas')
        .select('ticker, sector')
        .eq('ticker', tickerUpper)
        .maybeSingle(),
      supabaseAdmin
        .from('noticias')
        .select('titulo, fuente, url, fecha_publicacion')
        .eq('ticker', tickerUpper)
        .order('fecha_publicacion', { ascending: false })
        .limit(5)
    ]);

    const empresa = empresaResult.data;

    // Relacionados (si hay sector)
    let relacionados = [];
    if (empresa?.sector) {
      const { data } = await supabaseAdmin
        .from('empresas')
        .select('ticker, nombre, sector')
        .eq('sector', empresa.sector)
        .neq('ticker', tickerUpper)
        .limit(4);
      relacionados = data || [];
    }

    // Top empresas (últimos 7 días) - una sola consulta
    const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: visitas } = await supabaseAdmin
      .from('visitas')
      .select('ticker')
      .gte('created_at', hace7dias)
      .not('ticker', 'is', null);

    const conteo = {};
    for (const v of visitas || []) {
      if (!v.ticker) continue;
      conteo[v.ticker] = (conteo[v.ticker] || 0) + 1;
    }
    const topTickers = Object.entries(conteo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([t, visitas]) => ({ ticker: t, visitas }));

    // Consulta única para enriquecer top
    let top = [];
    if (topTickers.length > 0) {
      const tickers = topTickers.map((t) => t.ticker);
      const { data: empresas } = await supabaseAdmin
        .from('empresas')
        .select('ticker, nombre, sector')
        .in('ticker', tickers);

      const mapa = {};
      for (const e of empresas || []) mapa[e.ticker] = e;
      top = topTickers
        .filter((t) => mapa[t.ticker])
        .map((t) => ({ ...mapa[t.ticker], visitas: t.visitas }));
    }

    return Response.json({
      relacionados,
      top,
      noticias: noticiasResult.data || []
    });
  } catch (err) {
    console.error('Error en /api/sidebar:', err);
    return Response.json({ relacionados: [], top: [], noticias: [] }, { status: 200 });
  }
}
