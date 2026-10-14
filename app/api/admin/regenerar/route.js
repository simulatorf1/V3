import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { tokenValido } from '../../../../lib/admin';
import { generarAnalisis } from '../../../../lib/autogenerar';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!tokenValido()) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ticker } = body;

    if (!ticker) {
      return Response.json({ error: 'Falta ticker' }, { status: 400 });
    }

    const tickerUpper = ticker.toUpperCase();

    // 1. Obtener la empresa
    const { data: empresa } = await supabaseAdmin
      .from('empresas')
      .select('*')
      .eq('ticker', tickerUpper)
      .maybeSingle();

    if (!empresa) {
      return Response.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    // 2. Regenerar el análisis (ignora la caché)
    const analisis = await generarAnalisis(tickerUpper, empresa);

    // 3. Guardar con upsert
    const slug = `${tickerUpper.toLowerCase()}__${empresa.nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')}`;

    const { error: errUpsert } = await supabaseAdmin
      .from('paginas')
      .upsert(
        {
          empresa_id: empresa.id,
          ticker: tickerUpper,
          slug,
          datos: analisis,
          actualizado_at: new Date().toISOString()
        },
        { onConflict: 'ticker' }
      );

    if (errUpsert) {
      return Response.json({ error: errUpsert.message }, { status: 500 });
    }

    return Response.json({ ok: true, ticker: tickerUpper });
  } catch (err) {
    console.error('Error regenerando:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
