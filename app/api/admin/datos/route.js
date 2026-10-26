import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { tokenValido } from '../../../../lib/admin';

export const dynamic = 'force-dynamic';

function rangoDesde(periodo) {
  const ahora = new Date();
  if (periodo === 'hoy') {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return { desde: d.toISOString(), hasta: ahora.toISOString() };
  }
  if (periodo === 'semana') {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return { desde: d.toISOString(), hasta: ahora.toISOString() };
  }
  if (periodo === 'mes') {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return { desde: d.toISOString(), hasta: ahora.toISOString() };
  }
  if (periodo === 'anio') {
    const d = new Date();
    d.setDate(d.getDate() - 365);
    return { desde: d.toISOString(), hasta: ahora.toISOString() };
  }
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return { desde: d.toISOString(), hasta: ahora.toISOString() };
}

export async function GET(request) {
  if (!tokenValido()) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'mes';
    const { desde } = rangoDesde(periodo);

    const hace5min = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const [
      totalVisitasRes,
      totalEmpresasRes,
      totalPaginasRes,
      visitantesAhoraRes
    ] = await Promise.all([
      supabaseAdmin.from('visitas').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('empresas').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('paginas').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('visitas')
        .select('ip_hash')
        .gte('created_at', hace5min)
        .not('ip_hash', 'is', null)
    ]);

    const visitantesAhora = new Set(
      (visitantesAhoraRes.data || []).map((v) => v.ip_hash)
    ).size;

    const { data: visitas } = await supabaseAdmin
      .from('visitas')
      .select('ruta, pais, ticker, created_at, user_agent, ip_hash')
      .gte('created_at', desde)
      .order('created_at', { ascending: false });

    const totalPeriodo = (visitas || []).length;

    const unicosPeriodo = new Set(
      (visitas || []).map((v) => v.ip_hash).filter(Boolean)
    ).size;

    const conteoRutas = {};
    for (const v of visitas || []) {
      if (!v.ruta) continue;
      conteoRutas[v.ruta] = (conteoRutas[v.ruta] || 0) + 1;
    }
    const topPaginas = Object.entries(conteoRutas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([ruta, visitas]) => ({ ruta, visitas }));

    const conteoPaises = {};
    for (const v of visitas || []) {
      const p = v.pais || 'Desconocido';
      conteoPaises[p] = (conteoPaises[p] || 0) + 1;
    }
    const topPaises = Object.entries(conteoPaises)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([pais, visitas]) => ({ pais, visitas }));

    const conteoTickers = {};
    for (const v of visitas || []) {
      if (!v.ticker) continue;
      conteoTickers[v.ticker] = (conteoTickers[v.ticker] || 0) + 1;
    }
    const topEmpresas = Object.entries(conteoTickers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([ticker, visitas]) => ({ ticker, visitas }));

    let diasGrafico = 14;
    if (periodo === 'hoy') diasGrafico = 1;
    if (periodo === 'semana') diasGrafico = 7;
    if (periodo === 'mes') diasGrafico = 30;
    if (periodo === 'anio') diasGrafico = 12;

    const porDia = {};
    if (periodo === 'anio') {
      const ahora = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(ahora);
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        porDia[key] = 0;
      }
      for (const v of visitas || []) {
        const key = v.created_at.slice(0, 7);
        if (porDia[key] !== undefined) porDia[key]++;
      }
    } else {
      const ahora = new Date();
      for (let i = diasGrafico - 1; i >= 0; i--) {
        const d = new Date(ahora);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        porDia[key] = 0;
      }
      for (const v of visitas || []) {
        const key = v.created_at.slice(0, 10);
        if (porDia[key] !== undefined) porDia[key]++;
      }
    }
    const visitasPorDia = Object.entries(porDia).map(([fecha, visitas]) => ({
      fecha,
      visitas
    }));

    const conteoDispositivos = { movil: 0, escritorio: 0, tablet: 0, desconocido: 0 };
    for (const v of visitas || []) {
      const ua = (v.user_agent || '').toLowerCase();
      if (!ua) conteoDispositivos.desconocido++;
      else if (/ipad|tablet/.test(ua)) conteoDispositivos.tablet++;
      else if (/mobile|android|iphone|ipod/.test(ua)) conteoDispositivos.movil++;
      else conteoDispositivos.escritorio++;
    }

    const { data: etiquetas } = await supabaseAdmin
      .from('visitantes_etiquetados')
      .select('ip_hash, etiqueta, color, numero');

    const etiquetasMap = {};
    for (const e of etiquetas || []) {
      etiquetasMap[e.ip_hash] = {
        etiqueta: e.etiqueta,
        color: e.color,
        numero: e.numero
      };
    }

    let listadoHoy = [];
    if (periodo === 'hoy') {
      listadoHoy = (visitas || []).map((v) => {
        const et = etiquetasMap[v.ip_hash];
        return {
          fecha: v.created_at,
          ruta: v.ruta,
          ticker: v.ticker,
          pais: v.pais,
          ip_hash: v.ip_hash,
          user_agent: v.user_agent,
          etiqueta: et ? et.etiqueta : null,
          color: et ? et.color : null,
          numero: et && et.numero ? et.numero : null
        };
      });
    }

    const { data: paginas } = await supabaseAdmin
      .from('paginas')
      .select('ticker, slug, actualizado_at')
      .order('actualizado_at', { ascending: false })
      .limit(200);

    const { data: comentarios } = await supabaseAdmin
      .from('comentarios')
      .select('id, ticker, autor, texto, created_at, ip_hash')
      .eq('aprobado', true)
      .order('created_at', { ascending: false })
      .limit(100);

    return Response.json({
      periodo,
      stats: {
        totalVisitas: totalVisitasRes.count || 0,
        totalEmpresas: totalEmpresasRes.count || 0,
        totalPaginas: totalPaginasRes.count || 0,
        visitantesAhora: visitantesAhora,
        totalPeriodo,
        unicosPeriodo,
        topPaginas,
        topPaises,
        topEmpresas,
        visitasPorDia,
        dispositivos: conteoDispositivos
      },
      listadoHoy,
      paginas: paginas || [],
      comentarios: comentarios || []
    });
  } catch (err) {
    console.error('Error en /api/admin/datos:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
