import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const MAX_LARGO = 1500;
const MIN_SEGUNDOS_ENTRE_COMENTARIOS = 60;

function hashIp(ip) {
  let h = 0;
  for (let i = 0; i < ip.length; i++) {
    h = (h << 5) - h + ip.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

async function obtenerEtiquetaParaIp(ipHash) {
  if (!ipHash) return null;
  const { data: existente } = await supabaseAdmin
    .from('visitantes_etiquetados')
    .select('etiqueta')
    .eq('ip_hash', ipHash)
    .maybeSingle();

  if (existente?.etiqueta) return existente.etiqueta;

  const { data: ultimo } = await supabaseAdmin
    .from('visitantes_etiquetados')
    .select('numero')
    .order('numero', { ascending: false })
    .limit(1)
    .maybeSingle();

  const siguiente = (ultimo?.numero || 0) + 1;
  const etiqueta = String(siguiente).padStart(7, '0');

  await supabaseAdmin.from('visitantes_etiquetados').insert({
    ip_hash: ipHash,
    etiqueta,
    numero: siguiente
  });

  return etiqueta;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = (searchParams.get('ticker') || '').toUpperCase();

  if (!ticker) {
    return Response.json({ comentarios: [] });
  }

  try {
    const { data } = await supabaseAdmin
      .from('comentarios')
      .select('id, autor, texto, created_at')
      .eq('ticker', ticker)
      .eq('aprobado', true)
      .order('created_at', { ascending: false })
      .limit(50);

    return Response.json({ comentarios: data || [] });
  } catch (e) {
    console.error('[comentarios GET] Error:', e.message);
    return Response.json({ comentarios: [] }, { status: 200 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { ticker, texto, honeypot } = body;

    // Honeypot: si está relleno, es un bot
    if (honeypot) {
      return Response.json({ ok: true, silencioso: true });
    }

    if (!ticker || !texto) {
      return Response.json({ error: 'Faltan campos' }, { status: 400 });
    }

    const tickerUpper = ticker.toUpperCase();
    const textoLimpio = String(texto).trim();

    if (textoLimpio.length < 2) {
      return Response.json({ error: 'El comentario es demasiado corto' }, { status: 400 });
    }
    if (textoLimpio.length > MAX_LARGO) {
      return Response.json({ error: `Máximo ${MAX_LARGO} caracteres` }, { status: 400 });
    }

    const urls = (textoLimpio.match(/https?:\/\//g) || []).length;
    if (urls > 2) {
      return Response.json({ error: 'Máximo 2 enlaces por comentario' }, { status: 400 });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const ipHash = ip !== 'unknown' ? hashIp(ip) : null;

    // ¿IP baneada?
    if (ipHash) {
      const { data: baneada } = await supabaseAdmin
        .from('ips_baneadas')
        .select('id')
        .eq('ip_hash', ipHash)
        .maybeSingle();
      if (baneada) {
        return Response.json({ error: 'No puedes comentar en este momento' }, { status: 403 });
      }
    }

    // ¿Comentario reciente del mismo IP y ticker?
    if (ipHash) {
      const hace60s = new Date(Date.now() - MIN_SEGUNDOS_ENTRE_COMENTARIOS * 1000).toISOString();
      const { data: reciente } = await supabaseAdmin
        .from('comentarios')
        .select('id')
        .eq('ip_hash', ipHash)
        .eq('ticker', tickerUpper)
        .gte('created_at', hace60s)
        .limit(1);
      if (reciente && reciente.length > 0) {
        return Response.json(
          { error: 'Espera un minuto antes de volver a comentar en esta empresa' },
          { status: 429 }
        );
      }
    }

    const autor = await obtenerEtiquetaParaIp(ipHash);

    const { data: insertado, error } = await supabaseAdmin
      .from('comentarios')
      .insert({
        ticker: tickerUpper,
        autor: autor || 'Visitante',
        texto: textoLimpio,
        aprobado: true,
        ip_hash: ipHash
      })
      .select('id, autor, texto, created_at')
      .single();

    if (error) {
      console.error('[comentarios POST] Error insert:', error);
      return Response.json({ error: 'No se pudo guardar' }, { status: 500 });
    }

    return Response.json({ ok: true, comentario: insertado });
  } catch (e) {
    console.error('[comentarios POST] Error:', e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
