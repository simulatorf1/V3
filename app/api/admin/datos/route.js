import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { tokenValido } from '../../../../lib/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!tokenValido()) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    // 1. Estadísticas generales
    const { count: totalVisitas } = await supabaseAdmin
      .from('visitas')
      .select('*', { count: 'exact', head: true });

    const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: visitas7d } = await supabaseAdmin
      .from('visitas')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', hace7dias);

    const { count: totalEmpresas } = await supabaseAdmin
      .from('empresas')
      .select('*', { count: 'exact', head: true });

    const { count: totalPaginas } = await supabaseAdmin
      .from('paginas')
      .select('*', { count: 'exact', head: true });

    // 2. Top páginas últimos 7 días
    const { data: visitasRecientes } = await supabaseAdmin
      .from('visitas')
      .select('ruta, pais')
      .gte('created_at', hace7dias);

    const conteoRutas = {};
    const conteoPaises = {};
    for (const v of visitasRecientes || []) {
      if (v.ruta) conteoRutas[v.ruta] = (conteoRutas[v.ruta] || 0) + 1;
      const pais = v.pais || 'Desconocido';
      conteoPaises[pais] = (conteoPaises[pais] || 0) + 1;
    }

    const topPaginas = Object.entries(conteoRutas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([ruta, visitas]) => ({ ruta, visitas }));

    const topPaises = Object.entries(conteoPaises)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([pais, visitas]) => ({ pais, visitas }));

    // 3. Páginas generadas
    const { data: paginas } = await supabaseAdmin
      .from('paginas')
      .select('ticker, slug, actualizado_at')
      .order('actualizado_at', { ascending: false })
      .limit(200);

    // 4. Comentarios pendientes (aún no existirán, devuelve vacío)
    const { data: comentarios } = await supabaseAdmin
      .from('comentarios')
      .select('id, ticker, autor, texto, created_at')
      .eq('aprobado', false)
      .limit(100);

    return Response.json({
      stats: {
        totalVisitas: totalVisitas || 0,
        visitas7d: visitas7d || 0,
        totalEmpresas: totalEmpresas || 0,
        totalPaginas: totalPaginas || 0,
        topPaginas,
        topPaises
      },
      paginas: paginas || [],
      comentarios: comentarios || []
    });
  } catch (err) {
    console.error('Error en /api/admin/datos:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
