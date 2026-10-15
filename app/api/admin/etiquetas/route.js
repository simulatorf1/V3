import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { tokenValido } from '../../../../lib/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!tokenValido()) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('visitantes_etiquetados')
    .select('ip_hash, etiqueta, color')
    .order('etiqueta', { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ etiquetas: data || [] });
}

export async function POST(request) {
  if (!tokenValido()) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ip_hash, etiqueta, color } = body;

    if (!ip_hash || !etiqueta) {
      return Response.json({ error: 'Faltan campos' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('visitantes_etiquetados')
      .upsert(
        {
          ip_hash,
          etiqueta,
          color: color || '#0b5fff',
          updated_at: new Date().toISOString()
        },
        { onConflict: 'ip_hash' }
      );

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!tokenValido()) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const ip_hash = searchParams.get('ip_hash');

    if (!ip_hash) {
      return Response.json({ error: 'Falta ip_hash' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('visitantes_etiquetados')
      .delete()
      .eq('ip_hash', ip_hash);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
