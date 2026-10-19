import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: cambios } = await supabaseAdmin
      .from('cambios_movimiento')
      .select('ticker, movimiento_anterior, movimiento_nuevo, detectado_at')
      .gte('detectado_at', hace24h)
      .order('detectado_at', { ascending: false })
      .limit(20);

    const movimientos = [];
    for (const c of cambios || []) {
      const { data: emp } = await supabaseAdmin
        .from('empresas')
        .select('nombre, sector')
        .eq('ticker', c.ticker)
        .maybeSingle();

      movimientos.push({
        ticker: c.ticker,
        nombre: emp?.nombre || c.ticker,
        sector: emp?.sector || null,
        movimientoAnterior: c.movimiento_anterior,
        movimientoNuevo: c.movimiento_nuevo
      });
    }

    return Response.json({ movimientos });
  } catch (err) {
    console.error('Error en /api/movimientos:', err);
    return Response.json({ movimientos: [] }, { status: 200 });
  }
}
