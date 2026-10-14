import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { tokenValido } from '../../../../lib/admin';

export const dynamic = 'force-dynamic';

function inicioDeHoy() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function inicioDeAyer() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 1);
  return d.toISOString();
}

function haceDias(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export async function GET() {
  if (!tokenValido()) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    // ============================================================
    // Totales globales
    // ============================================================
    const { count: totalVisitas } = await supabaseAdmin
      .from('visitas')
      .select('*', { count: 'exact', head: true });

    const { count: totalEmpresas } = await supabaseAdmin
      .from('empresas')
      .select('*', { count: 'exact', head: true });

    const { count: totalPaginas } = await supabaseAdmin
      .from('paginas')
      .select('*', { count: 'exact', head: true });

    // ============================================================
    // Hoy
    // ============================================================
    const { count: visitasHoy } = await supabaseAdmin
      .from('visitas')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', inicioDeHoy());

    // ============================================================
    // Ayer
    // ============================================================
    const { count: visitasAyer } = await supabaseAdmin
      .from('visitas')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', inicioDeAyer())
      .lt('created_at', inicioDeHoy());

    // ============================================================
    // Últimos 7 días
    // ============================================================
    const { count: visitas7d } = await supabaseAdmin
      .from('visitas')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', haceDias(7));

    // ============================================================
    // Últimos 30 días
    // ============================================================
    const { count: visitas30d } = await supabaseAdmin
      .from('visitas')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', haceDias(30));

    // ============================================================
    // Únicos (por ip_hash) hoy, 7d, 30d
    // ============================================================
    const { data: unicosHoyRaw } = await supabaseAdmin
      .from('visitas')
      .select('ip_hash')
      .gte('created_at', inicioDeHoy())
      .not('ip_hash', 'is', null);
    const unicosHoy = new Set((unicosHoyRaw || []).map((v) => v.ip_hash)).size;

    const { data: unicos7dRaw } = await supabaseAdmin
      .from('visitas')
      .select('ip_hash')
      .gte('created_at', haceDias(7))
      .not('ip_hash', 'is', null);
    const unicos7d = new Set((unicos7dRaw || []).map((v) => v.ip_hash)).size;

    const { data: unicos30dRaw } = await supabaseAdmin
      .from('visitas')
      .select('ip_hash')
      .gte('created_at', haceDias(30))
      .not('ip_hash', 'is', null);
    const unicos30d = new Set((unicos30dRaw || []).map((v) => v.ip_hash)).size;

    // ============================================================
    // Últimos 30 días de visitas (para análisis)
    // ============================================================
    const { data: visitasRecientes } = await supabaseAdmin
      .from('visitas')
      .select('ruta, pais, ticker, created_at, user_agent, ip_hash')
      .gte('created_at', haceDias(30));

    // ============================================================
    // Páginas más visitadas (30 días)
    // ============================================================
    const conteoRutas = {};
    for (const v of visitasRecientes || []) {
      if (!v.ruta) continue;
      conteoRutas[v.ruta] = (conteoRutas[v.ruta] || 0) + 1;
    }
    const topPaginas = Object.entries(conteoRutas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([ruta, visitas]) => ({ ruta, visitas }));

    // ============================================================
    // Países (30 días)
    // ============================================================
    const conteoPaises = {};
    for (const v of visitasRecientes || []) {
      const p = v.pais || 'Desconocido';
      conteoPaises[p] = (conteoPaises[p] || 0) + 1;
    }
    const topPaises = Object.entries(conteoPaises)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([pais, visitas]) => ({ pais, visitas }));

    // ============================================================
    // Empresas más visitadas (30 días)
    // ============================================================
    const conteoTickers = {};
    for (const v of visitasRecientes || []) {
      if (!v.ticker) continue;
      conteoTickers[v.ticker] = (conteoTickers[v.ticker] || 0) + 1;
    }
    const topEmpresas = Object.entries(conteoTickers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([ticker, visitas]) => ({ ticker, visitas }));

    // ============================================================
    // Visitas por día (últimos 14 días)
    // ============================================================
    const porDia = {};
    const hoy = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(hoy);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      porDia[key] = 0;
    }
    for (const v of visitasRecientes || []) {
      const key = v.created_at.slice(0, 10);
      if (porDia[key] !== undefined) porDia[key]++;
    }
    const visitasPorDia = Object.entries(porDia).map(([fecha, visitas]) => ({
      fecha,
      visitas
    }));

    // ============================================================
    // Visitas por hora del día (últimos 30 días, hora Madrid)
    // ============================================================
    const porHora = {};
    for (let i = 0; i < 24; i++) porHora[i] = 0;
    for (const v of visitasRecientes || []) {
      const hora = new Date(v.created_at).toLocaleString('es-ES', {
        timeZone: 'Europe/Madrid',
        hour: '2-digit',
        hour12: false
      });
      const h = parseInt(hora, 10);
      if (!isNaN(h)) porHora[h]++;
    }
    const visitasPorHora = Object.entries(porHora).map(([hora, visitas]) => ({
      hora: parseInt(hora, 10),
      visitas
    }));

    // ============================================================
    // Visitantes en tiempo real (últimos 5 minutos)
    // ============================================================
    const { count: visitantesAhora } = await supabaseAdmin
      .from('visitas')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    // ============================================================
    // Dispositivos (user_agent) - simplificado
    // ============================================================
    const conteoDispositivos = { movil: 0, escritorio: 0, tablet: 0, desconocido: 0 };
    for (const v of visitasRecientes || []) {
      const ua = (v.user_agent || '').toLowerCase();
      if (!ua) {
        conteoDispositivos.desconocido++;
      } else if (/ipad|tablet/.test(ua)) {
        conteoDispositivos.tablet++;
      } else if (/mobile|android|iphone|ipod/.test(ua)) {
        conteoDispositivos.movil++;
      } else {
        conteoDispositivos.escritorio++;
      }
    }

    // ============================================================
    // Páginas generadas (para la pestaña de páginas)
    // ============================================================
    const { data: paginas } = await supabaseAdmin
      .from('paginas')
      .select('ticker, slug, actualizado_at')
      .order('actualizado_at', { ascending: false })
      .limit(200);

    // ============================================================
    // Comentarios pendientes (placeholder)
    // ============================================================
    const { data: comentarios } = await supabaseAdmin
      .from('comentarios')
      .select('id, ticker, autor, texto, created_at')
      .eq('aprobado', false)
      .limit(100);

    return Response.json({
      stats: {
        totalVisitas: totalVisitas || 0,
        totalEmpresas: totalEmpresas || 0,
        totalPaginas: totalPaginas || 0,
        visitasHoy: visitasHoy || 0,
        visitasAyer: visitasAyer || 0,
        visitas7d: visitas7d || 0,
        visitas30d: visitas30d || 0,
        unicosHoy,
        unicos7d,
        unicos30d,
        visitantesAhora: visitantesAhora || 0,
        topPaginas,
        topPaises,
        topEmpresas,
        visitasPorDia,
        visitasPorHora,
        dispositivos: conteoDispositivos
      },
      paginas: paginas || [],
      comentarios: comentarios || []
    });
  } catch (err) {
    console.error('Error en /api/admin/datos:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
