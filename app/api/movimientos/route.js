import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: paginas } = await supabaseAdmin
      .from('paginas')
      .select('ticker, datos, actualizado_at, ultimo_movimiento_anterior')
      .gte('actualizado_at', hace24h)
      .not('ultimo_movimiento_anterior', 'is', null)
      .limit(30);

    const movimientos = [];

    for (const p of paginas || []) {
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

    return Response.json({ movimientos });
  } catch (err) {
    console.error('Error en /api/movimientos:', err);
    return Response.json({ movimientos: [] }, { status: 200 });
  }
}

