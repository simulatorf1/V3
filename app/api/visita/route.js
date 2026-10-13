import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function POST(request) {
  try {
    const body = await request.json();
    const { ticker, ruta } = body;

    if (!ruta) {
      return Response.json({ error: 'Falta ruta' }, { status: 400 });
    }

    // Detectar país desde headers de Vercel (si está disponible)
    const pais = request.headers.get('x-vercel-ip-country') || null;
    const referer = request.headers.get('referer') || null;

    await supabaseAdmin.from('visitas').insert({
      ticker: ticker ? ticker.toUpperCase() : null,
      ruta,
      referer,
      pais
    });

    return Response.json({ ok: true });
  } catch (err) {
    // No fallamos nunca por una visita
    return Response.json({ ok: false }, { status: 200 });
  }
}
