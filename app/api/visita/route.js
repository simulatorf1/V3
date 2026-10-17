import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function POST(request) {
  try {
    const body = await request.json();
    const { ticker, ruta } = body;

    if (!ruta) {
      return Response.json({ error: 'Falta ruta' }, { status: 400 });
    }

    const pais = request.headers.get('x-vercel-ip-country') || null;
    const referer = request.headers.get('referer') || null;
    const userAgent = request.headers.get('user-agent') || null;

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    let hashIp = null;
    if (ip !== 'unknown') {
      let h = 0;
      for (let i = 0; i < ip.length; i++) {
        h = (h << 5) - h + ip.charCodeAt(i);
        h |= 0;
      }
      hashIp = Math.abs(h).toString(36);
    }

    // Si es una IP nueva, crear registro automático con número
    if (hashIp) {
      const { data: existente } = await supabaseAdmin
        .from('visitantes_etiquetados')
        .select('id')
        .eq('ip_hash', hashIp)
        .maybeSingle();

      if (!existente) {
        const { data: ultimo } = await supabaseAdmin
          .from('visitantes_etiquetados')
          .select('numero')
          .order('numero', { ascending: false })
          .limit(1)
          .maybeSingle();

        const siguienteNumero = ultimo?.numero ? ultimo.numero + 1 : 1;
        const etiquetaAuto = String(siguienteNumero).padStart(7, '0');

        await supabaseAdmin
          .from('visitantes_etiquetados')
          .insert({
            ip_hash: hashIp,
            etiqueta: etiquetaAuto,
            numero: siguienteNumero
          });
      }
    }

    await supabaseAdmin.from('visitas').insert({
      ticker: ticker ? ticker.toUpperCase() : null,
      ruta,
      referer,
      pais,
      user_agent: userAgent,
      ip_hash: hashIp
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error('Error en /api/visita:', err);
    return Response.json({ ok: false }, { status: 200 });
  }
}
