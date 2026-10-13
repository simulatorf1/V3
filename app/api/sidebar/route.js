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

    // 1. Empresa actual para sacar su sector
    const { data: empresa } = await supabaseAdmin
      .from('empresas')
      .select('ticker, sector')
      .eq('ticker', tickerUpper)
      .maybeSingle();

    // 2. Empresas relacionadas del mismo sector
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

    // 3. Valores más consultados de la semana
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

    const top = [];
    for (const t of topTickers) {
      const { data: emp } = await supabaseAdmin
        .from('empresas')
        .select('ticker, nombre, sector')
        .eq('ticker', t.ticker)
        .maybeSingle();
      if (emp) top.push({ ...emp, visitas: t.visitas });
    }

    // 4. Noticias de la empresa
    const { data: noticias } = await supabaseAdmin
      .from('noticias')
      .select('titulo, fuente, url, fecha_publicacion')
      .eq('ticker', tickerUpper)
      .order('fecha_publicacion', { ascending: false })
      .limit(5);

    return Response.json({
      relacionados,
      top,
      noticias: noticias || []
    });
  } catch (err) {
    console.error('Error en /api/sidebar:', err);
    return Response.json(
      { relacionados: [], top: [], noticias: [] },
      { status: 200 }
    );
  }
}
