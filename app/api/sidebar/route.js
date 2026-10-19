import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');

    if (!ticker) {
      return Response.json({ relacionados: [], top: [], noticias: [], movimientos: [] });
    }

    const tickerUpper = ticker.toUpperCase();
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [empresaResult, noticiasResult, paginasRecientes] = await Promise.all([
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
        .limit(5),
      supabaseAdmin
        .from('paginas')
        .select('ticker, datos, actualizado_at, ultimo_movimiento_anterior')
        .gte('actualizado_at', hace24h)
        .not('ultimo_movimiento_anterior', 'is', null)
        .limit(30)
    ]);

    const empresa = empresaResult.data;

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

    let top = [];
    if (topTickers.length > 0) {
      const tickers = topTickers.map((t) => t.ticker);
      const { data: empresasTop } = await supabaseAdmin
        .from('empresas')
        .select('ticker, nombre, sector')
        .in('ticker', tickers);

      const mapa = {};
      for (const e of empresasTop || []) mapa[e.ticker] = e;
      top = topTickers
        .filter((t) => mapa[t.ticker])
        .map((t) => ({ ...mapa[t.ticker], visitas: t.visitas }));
    }

    // Movimientos de hoy
    const movimientos = [];
    for (const p of paginasRecientes.data || []) {
      let datos = p.datos;
      if (typeof datos === 'string') {
        try { datos = JSON.parse(datos); } catch (e) { continue; }
      }
      let senales = datos.senales;
      if (typeof senales === 'string') {
        try { senales = JSON.parse(senales); } catch (e) { senales = []; }
      }
      const ultima = Array.isArray(senales) && senales.length > 0
        ? senales[senales.length - 1]
        : null;
      const movActual = ultima ? ultima.tipo : null;

      if (
        p.ultimo_movimiento_anterior &&
        movActual &&
        p.ultimo_movimiento_anterior !== movActual
      ) {
        const { data: emp } = await supabaseAdmin
          .from('empresas')
          .select('nombre, sector')
          .eq('ticker', p.ticker)
          .maybeSingle();

        movimientos.push({
          ticker: p.ticker,
          nombre: emp?.nombre || p.ticker,
          sector: emp?.sector || null,
          movimientoAnterior: p.ultimo_movimiento_anterior,
          movimientoNuevo: movActual
        });
      }
    }

    return Response.json({
      relacionados,
      top,
      noticias: noticiasResult.data || [],
      movimientos
    });
  } catch (err) {
    console.error('Error en /api/sidebar:', err);
    return Response.json(
      { relacionados: [], top: [], noticias: [], movimientos: [] },
      { status: 200 }
    );
  }
}
