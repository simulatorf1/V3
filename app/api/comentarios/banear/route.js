import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { ip_hash, motivo } = body;
    if (!ip_hash) return Response.json({ error: 'Falta ip_hash' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('ips_baneadas')
      .insert({ ip_hash, motivo: motivo || null });

    if (error && !error.message.includes('duplicate')) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Marcar todos los comentarios de esa IP como ocultos
    await supabaseAdmin
      .from('comentarios')
      .update({ aprobado: false })
      .eq('ip_hash', ip_hash);

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
